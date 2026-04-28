"""LangGraph multi-intent personal agent: app help, quiz generation, dashboard recommendations."""

from __future__ import annotations

import json
import os
import re
from typing import Any, Literal, TypedDict

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_groq import ChatGroq
from langgraph.graph import END, START, StateGraph
from pydantic import BaseModel, Field

from app.backend_client import fetch_agent_dashboard_from_backend
from app.sesa_context import AGENT_PERSONA, APP_GUIDE


class RouterOut(BaseModel):
    intent: Literal["app_help", "quiz", "recommend", "general", "document_qa"] = Field(
        description=(
            "app_help=SESA app UI, enroll, pay, dashboard. "
            "quiz=practice questions. recommend=next course/study from dashboard. "
            "document_qa=question about the user's OWN uploaded file/PDF/notes content. general=other."
        )
    )


class AgentState(TypedDict, total=False):
    user_message: str
    role: str
    user_name: str
    user_id: str
    dashboard_context: dict[str, Any]
    conversation_history: list[dict[str, str]]
    intent: str
    reply: str
    quiz: dict[str, Any]
    recommendations: list[dict[str, Any]]
    use_rag: bool
    response_mode: str
    """Bundled extracted text from Node (same user); not persisted in Python."""
    document_context: str
    rag_context: str
    rag_citations: list[str]
    user_document_names: list[str]


def _response_mode_extras(response_mode: str) -> str:
    m = (response_mode or "default").strip().lower()
    if m == "tutorial":
        return (
            "Response mode: TUTORIAL. Use numbered steps, define jargon briefly, "
            "and prioritize clarity. When USER DOCUMENT TEXT is present, ground steps in that material when it matches the question."
        )
    if m == "research":
        return (
            "Response mode: RESEARCH. Synthesize the USER DOCUMENT TEXT and dashboard data; "
            "prefer bullets, mark uncertainty, and mention which source each key claim leans on."
        )
    if m == "conversation" or m == "conversation_history":
        return (
            "Response mode: CONVERSATION. Be natural and concise; use prior messages for continuity; "
            "avoid a lecture tone unless the user requests depth. Still use USER DOCUMENT TEXT when relevant."
        )
    return (
        "Response mode: DEFAULT. Balanced, clear answers; use USER DOCUMENT TEXT as supporting evidence when provided."
    )


def _rag_block(state: AgentState) -> str:
    rctx = (state.get("rag_context") or "").strip()
    udn = [str(s).strip() for s in (state.get("user_document_names") or []) if str(s).strip()][:20]
    use = bool(state.get("use_rag"))
    if rctx.startswith("SYNC_INFO:"):
        return "\n\n" + rctx
    if rctx.startswith("(No relevant"):
        block = f"\n\n--- USER DOCUMENTS ---\n{rctx}"
        if use and udn:
            block += (
                f"\n\n(Indexed file names: {', '.join(udn)}. No passage matched the query. "
                "If they asked about the file, suggest rephrasing or asking for a specific section.)"
            )
        return block
    if not rctx and use and udn:
        return (
            "\n\n--- USER INDEXED UPLOADS ---\n"
            f"File(s) on record: {', '.join(udn)}. (No document text was included in this request.)"
        )
    if not rctx:
        return ""
    return "\n\n--- USER DOCUMENT TEXT (uploads; answer from this when relevant) ---\n" + rctx


def _mode_suffix(state: AgentState) -> str:
    return "\n\n" + _response_mode_extras(str(state.get("response_mode") or "default"))


def _history_limit(state: AgentState) -> int:
    mode = (state.get("response_mode") or "default").lower()
    return 12 if mode in ("conversation", "conversation_history") else 6


def _chat_messages(state: AgentState, system: str) -> list[HumanMessage | SystemMessage]:
    """Reusable multi-turn context for the personal assistant (same pattern across intents)."""
    lim = _history_limit(state)
    hist = state.get("conversation_history") or []
    msgs: list[HumanMessage | SystemMessage] = [SystemMessage(content=system)]
    for turn in hist[-lim:]:
        role = turn.get("role", "user")
        content = turn.get("content", "")
        if role == "assistant":
            msgs.append(SystemMessage(content="Previous assistant: " + str(content)[:1500]))
        else:
            msgs.append(HumanMessage(content=str(content)[:1500]))
    msgs.append(HumanMessage(content=state["user_message"]))
    return msgs


def _llm() -> ChatGroq:
    key = os.environ.get("GROQ_API_KEY", "").strip()
    if not key:
        raise RuntimeError("GROQ_API_KEY is not set for python-agents")
    return ChatGroq(
        model=os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile").strip(),
        temperature=0.25,
        api_key=key,
    )


def router_node(state: AgentState) -> dict[str, str]:
    llm = _llm().with_structured_output(RouterOut)
    text = state["user_message"].strip()
    udn = list(state.get("user_document_names") or [])
    udn_str = ", ".join(udn) if udn else ""
    registered = (
        f"\nThe SESA app currently lists these documents as successfully indexed: {udn_str}. "
        f"You MUST NOT deny that the user has uploads when that list is non-empty.\n"
        if udn
        else ""
    )
    rag_note = ""
    if state.get("use_rag"):
        cites = state.get("rag_citations") or []
        rctx0 = (state.get("rag_context") or "").strip()
        if cites and rctx0 and not rctx0.startswith(("(No relevant", "SYNC_INFO:")):
            rag_note = (
                f"\nIMPORTANT: The user turned on document mode. The system already pulled text from their upload(s): "
                f"{', '.join(cites)}. If the question can be answered from those materials (summary, facts, ‘what does it say’, "
                f"‘explain this file’), you MUST output intent document_qa — not app_help or general.\n"
            )
        elif cites and (rctx0.startswith("(No relevant") or rctx0.startswith("SYNC_INFO:")):
            rag_note = (
                f"\nDocument mode: indexed file name(s) on file: {', '.join(cites)}. "
                "If the user is asking about their file’s *content* (not the SESA app), choose document_qa — not app_help or recommend.\n"
            )
        else:
            rag_note = (
                "\nIMPORTANT: Document mode is ON. "
                "If the user is asking about their own file, PDF, or ‘what it says’ / ‘explain’ / ‘summary’, use document_qa — not app_help.\n"
            )
    sys = (
        registered
        + "Classify the user's latest message for an educational web app.\n"
        "- document_qa: the user is asking you to read or use THEIR OWN uploaded file(s) or notes "
        "(e.g. 'my PDF', 'the file I uploaded', 'what does my document say', 'from my materials', 'according to my notes', "
        "'summarize my upload', 'question about this document', 'what is this about', 'explain the text').\n"
        "- app_help: SESA app navigation, enroll, pay, certificates, dashboard, where a feature is (NOT the text inside their file).\n"
        "- quiz: user wants generated quiz questions, practice tests, or 'drill me' on a topic.\n"
        "- recommend: what to study or which course to take next (uses dashboard, not their PDF content).\n"
        "- general: other questions, including if it's vague or not clearly about an uploaded file.\n"
        "If the user asks what you can do, your features, or how to use this assistant, prefer app_help (or general if purely meta and not SESA-specific).\n"
        "If both document_qa and another category might fit, choose document_qa when the user clearly refers to their uploaded file content.\n"
        + rag_note
        + "Return only the structured intent field."
    )
    out = llm.invoke([SystemMessage(content=sys), HumanMessage(content=text)])
    return {"intent": out.intent}


def attach_rag_node(state: AgentState) -> dict[str, Any]:
    """Attach full document text from Node (`document_context`); no vector retrieval."""
    if not state.get("use_rag"):
        return {"rag_context": "", "rag_citations": []}
    udn = [str(s).strip() for s in (state.get("user_document_names") or []) if str(s).strip()][:20]
    dctx = (state.get("document_context") or "").strip()
    if dctx:
        max_chars = 200_000
        if len(dctx) > max_chars:
            dctx = dctx[:max_chars] + "\n\n[...truncated for this turn]"
        return {"rag_context": dctx, "rag_citations": udn}
    if udn:
        return {
            "rag_context": (
                "SYNC_INFO: Document mode is on and these files are listed in the app, "
                "but no document text was sent with this request (re-upload or wait until processing finishes)."
            ),
            "rag_citations": udn,
        }
    return {"rag_context": "", "rag_citations": []}


def route_from_intent(state: AgentState) -> str:
    intent = state.get("intent") or "general"
    umsg = (state.get("user_message") or "").lower()
    if state.get("use_rag"):
        udn = state.get("user_document_names") or []
        nav = any(
            x in umsg
            for x in (
                "how do i enroll",
                "where is the menu",
                "navigate to",
                "settings page",
                "click on",
                "how to pay",
                "payment page",
            )
        )
        fileish = any(
            x in umsg
            for x in (
                "pdf",
                "file",
                "document",
                "upload",
                "uploaded",
                "summary",
                "summarize",
                "explain",
                "explanation",
                "says",
                "text",
                "content",
                "what does",
                "main points",
                "describe",
                "according",
                "passage",
                "lecture",
                "read",
                "notes",
                "material",
                "chapter",
                "section",
                "page",
                "attachment",
                "attached",
                "homework",
                "the paper",
                "my book",
            )
        )
        if (not nav) and fileish and intent in ("app_help", "general", "recommend", "quiz"):
            return "document_qa"
    if intent in ("app_help", "quiz", "recommend", "general", "document_qa"):
        return intent
    return "general"


def refresh_dashboard_node(state: AgentState) -> dict[str, Any]:
    """
    Pull a fresh dashboard from Node (Mongo) for intents that benefit from live data.
    Requires BACKEND_INTERNAL_API_BASE and user_id on the agent process.
    """
    intent = state.get("intent") or "general"
    uid = (state.get("user_id") or "").strip()
    base = os.environ.get("BACKEND_INTERNAL_API_BASE", "").strip()
    if not uid or not base:
        return {}
    if intent not in ("recommend", "app_help", "quiz"):
        return {}
    try:
        fresh = fetch_agent_dashboard_from_backend(base, uid)
        if isinstance(fresh, dict) and fresh:
            return {"dashboard_context": fresh}
    except Exception:
        pass
    return {}


def _dash_str(state: AgentState) -> str:
    raw = json.dumps(state.get("dashboard_context") or {}, default=str)
    if len(raw) > 12000:
        return raw[:12000] + "…"
    return raw


def app_help_node(state: AgentState) -> dict[str, str]:
    llm = _llm()
    dash = _dash_str(state)
    sys = (
        AGENT_PERSONA
        + "\n\n"
        + APP_GUIDE
        + "\n\nCurrent user role: "
        + state.get("role", "student")
        + "\nDashboard snapshot (JSON):\n"
        + dash
        + _rag_block(state)
        + _mode_suffix(state)
        + "\nGive short, actionable steps. Mention quickActions routes when relevant. "
        "Use prior messages if the user is following up (e.g. 'where is that', 'I don't see it')."
    )
    text = llm.invoke(_chat_messages(state, sys)).content
    return {"reply": str(text).strip()}


def quiz_node(state: AgentState) -> dict[str, Any]:
    llm = _llm()
    dash = _dash_str(state)
    sys = (
        AGENT_PERSONA
        + "\n\n"
        "You write educational quiz JSON for the SESA app (dynamic, per request). "
        "Use the latest user message as the main topic. If the conversation or dashboard mentions an enrolled or in-progress course, align the quiz with that. "
        "If USER DOCUMENT TEXT (uploads) is present and matches the topic, base questions on that material. "
        "Vary difficulty as requested, default to a mix of easy/medium.\n"
        "Respond with a single JSON object ONLY, no markdown, shape:\n"
        '{"questions":[{"question":"str","type":"multiple_choice|true_false|short_answer","options":["A","B","C","D"] or [],"correct_answer":0 or "text","explanation":"str","difficulty":"easy|medium|hard"}]}\n'
        f"Dashboard JSON (may be partial):\n{dash}"
        + _rag_block(state)
        + _mode_suffix(state)
    )
    raw = llm.invoke(_chat_messages(state, sys)).content
    raw_s = str(raw).strip()
    raw_s = re.sub(r"^```(?:json)?\s*", "", raw_s)
    raw_s = re.sub(r"\s*```$", "", raw_s)
    try:
        quiz = json.loads(raw_s)
        if not isinstance(quiz, dict):
            quiz = {"questions": []}
        if "questions" not in quiz:
            quiz = {"questions": []}
    except json.JSONDecodeError:
        quiz = {"questions": [], "parse_error": True, "raw": raw_s[:2000]}
    intro = (
        "Here is a practice set you can use in your study session. "
        "If anything looks off, ask me to regenerate with a tighter topic."
    )
    return {"reply": intro, "quiz": quiz}


def recommend_node(state: AgentState) -> dict[str, Any]:
    llm = _llm()
    dash = _dash_str(state)
    sys = (
        AGENT_PERSONA
        + "\n\n"
        "You are a learning coach for SESA. Using the live dashboard JSON and any USER DOCUMENT TEXT, suggest concrete, personalized next steps "
        "(which course to open, whether to browse recommendations, certificates, or focus time on in-progress courses with low completion). "
        "Reference quickActions and enrollment/progress fields when they appear in the snapshot. "
        "If the user message refers to a prior turn, continue that thread. "
        "Also output structured recommendations in your answer: on the last line, exactly this pattern:\n"
        "RECOMMENDATIONS_JSON::"
        '[{"title":"...","reason":"...","courseId":"optional id from snapshot"}]\n'
        "The last line must start with RECOMMENDATIONS_JSON:: followed by a valid JSON array."
        "\nDashboard:\n"
        + dash
        + _rag_block(state)
        + _mode_suffix(state)
    )
    text = llm.invoke(_chat_messages(state, sys)).content
    full = str(text).strip()
    recs: list[dict[str, Any]] = []
    reply = full
    if "RECOMMENDATIONS_JSON::" in full:
        head, tail = full.rsplit("RECOMMENDATIONS_JSON::", 1)
        reply = head.strip()
        try:
            parsed = json.loads(tail.strip())
            if isinstance(parsed, list):
                recs = [r for r in parsed if isinstance(r, dict)]
        except json.JSONDecodeError:
            recs = []
    return {"reply": reply or "Here are a few suggestions based on your dashboard.", "recommendations": recs}


def document_qa_node(state: AgentState) -> dict[str, str]:
    """Answer from full document text when the user asks about their uploaded files."""
    udn = list(state.get("user_document_names") or [])
    if not state.get("use_rag"):
        return {
            "reply": (
                "To answer from your own files, turn on “Documents” in this assistant, "
                "and make sure you have uploaded documents (enrolled students only). "
                "Then ask your question again."
            ),
        }
    rctx = (state.get("rag_context") or "").strip()
    if rctx.startswith("(No relevant"):
        if udn:
            return {
                "reply": (
                    f"I have your file(s) ({', '.join(udn)}), but nothing in the bundled text matched that question clearly. "
                    "Try asking about a specific section, page, or keyword from the document."
                ),
            }
        return {
            "reply": (
                "I could not match your question to the document text available for this turn. "
                "Try rephrasing or upload the file again and wait until it shows as ready."
            ),
        }
    rblock = _rag_block(state)
    if not rblock and udn:
        return {
            "reply": (
                f"Your app lists: {', '.join(udn)}, but I did not receive the document text. "
                "Re-upload the file with the backend and python-agents running, then ask again."
            ),
        }
    if not rblock:
        return {
            "reply": (
                "I do not have usable text from your files for this. "
                "Add a document (PDF, Word, or text) and wait until it is ready, then try again."
            ),
        }
    llm = _llm()
    is_sync = rctx.startswith("SYNC_INFO:") or "SYNC_INFO" in rblock
    detail = (
        "Give a thorough answer: use sections or bullet points as appropriate. For tutorial mode, use numbered steps. "
        "For research mode, use bullet facts and name the file for each. "
    )
    sys = (
        AGENT_PERSONA
        + "\n\n"
        + (detail if not is_sync else "")
        + "The user is asking about their OWN files. You MUST follow the information below. "
        "NEVER state that the user has no upload if USER DOCUMENT TEXT / SYNC_INFO shows files. "
        "Do not replace this with a generic dashboard/JSON walkthrough unless the user asked about the SESA app UI. "
        "For SYNC_INFO, explain that document text was not included with this request and they should re-upload or retry. "
        "Otherwise use USER DOCUMENT TEXT: quote or paraphrase; name the file in brackets. Do not invent facts not in the sources.\n"
        + rblock
        + _mode_suffix(state)
    )
    text = llm.invoke(_chat_messages(state, sys)).content
    return {"reply": str(text).strip()}


def general_node(state: AgentState) -> dict[str, str]:
    llm = _llm()
    dash = _dash_str(state)
    has_rag = bool(_rag_block(state).strip())
    rag_line = (
        "When USER DOCUMENT TEXT is present and on-topic, use it to answer fact questions about that material. "
        if has_rag
        else ""
    )
    sys = (
        AGENT_PERSONA
        + "\n\n"
        "You are SafeEdu SESA assistant: helpful, concise, friendly. "
        + rag_line
        + "You may reference dashboard JSON and USER DOCUMENT TEXT to personalize and ground answers. "
        "If the user might benefit from a structured quiz or next-step plan, you may briefly offer those as follow-ups, but answer their actual question first.\n"
        + dash
        + _rag_block(state)
        + _mode_suffix(state)
    )
    text = llm.invoke(_chat_messages(state, sys)).content
    return {"reply": str(text).strip()}


def build_graph():
    """
    Personal assistant graph: attach user document text → intent router → optional live dashboard refresh
    (app_help, recommend, quiz) → specialist node.
    """
    g = StateGraph(AgentState)
    g.add_node("attach_rag", attach_rag_node)
    g.add_node("router", router_node)
    g.add_node("refresh_context", refresh_dashboard_node)
    g.add_node("app_help", app_help_node)
    g.add_node("quiz", quiz_node)
    g.add_node("recommend", recommend_node)
    g.add_node("document_qa", document_qa_node)
    g.add_node("general", general_node)

    g.add_edge(START, "attach_rag")
    g.add_edge("attach_rag", "router")
    g.add_edge("router", "refresh_context")
    g.add_conditional_edges(
        "refresh_context",
        route_from_intent,
        {
            "app_help": "app_help",
            "quiz": "quiz",
            "recommend": "recommend",
            "document_qa": "document_qa",
            "general": "general",
        },
    )
    g.add_edge("app_help", END)
    g.add_edge("quiz", END)
    g.add_edge("recommend", END)
    g.add_edge("document_qa", END)
    g.add_edge("general", END)
    return g.compile()


GRAPH = build_graph()
