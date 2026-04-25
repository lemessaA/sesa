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
    rag_context: str
    rag_citations: list[str]
    user_document_names: list[str]


def _response_mode_extras(response_mode: str) -> str:
    m = (response_mode or "default").strip().lower()
    if m == "tutorial":
        return (
            "Response mode: TUTORIAL. Use numbered steps, define jargon briefly, "
            "and prioritize clarity. When RETRIEVED SOURCES are present, ground steps in them."
        )
    if m == "research":
        return (
            "Response mode: RESEARCH. Synthesize the RETRIEVED SOURCES and dashboard data; "
            "prefer bullets, mark uncertainty, and mention which source each key claim leans on."
        )
    if m == "conversation" or m == "conversation_history":
        return (
            "Response mode: CONVERSATION. Be natural and concise; use prior messages for continuity; "
            "avoid a lecture tone unless the user requests depth. Still use RETRIEVED SOURCES when relevant."
        )
    return (
        "Response mode: DEFAULT. Balanced, clear answers; use RETRIEVED SOURCES as supporting evidence when provided."
    )


def _rag_block(state: AgentState) -> str:
    rctx = (state.get("rag_context") or "").strip()
    if rctx.startswith("SYNC_INFO:"):
        return "\n\n" + rctx
    if not rctx or rctx.startswith("(No relevant") or rctx.startswith("(RAG index"):
        return ""
    return "\n\n--- RETRIEVED SOURCES (user-uploaded documents) ---\n" + rctx


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
        if cites:
            rag_note = (
                f"\nIMPORTANT: The user turned on document mode. The system already pulled text from their upload(s): "
                f"{', '.join(cites)}. If the question can be answered from those materials (summary, facts, ‘what does it say’, "
                f"‘explain this file’), you MUST output intent document_qa — not app_help or general.\n"
            )
        else:
            rag_note = (
                "\nIMPORTANT: Document mode is ON; excerpts may be broad. "
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
    from app.rag.vector_store import RAGStore, search_user_rag

    if not state.get("use_rag"):
        return {"rag_context": "", "rag_citations": []}
    uid = (state.get("user_id") or "").strip()
    if not uid:
        return {"rag_context": "", "rag_citations": []}
    udn = [str(s).strip() for s in (state.get("user_document_names") or []) if str(s).strip()][:20]
    q = (state.get("user_message") or "").strip()
    if not q and udn:
        q = "summary main points content"  # still run keyword search
    if not q:
        return {"rag_context": "", "rag_citations": []}
    st = RAGStore.load(uid)
    try:
        hits = search_user_rag(uid, q, top_k=5)
    except Exception:
        return {"rag_context": "(RAG index unavailable.)", "rag_citations": []}
    if (not hits) and st.has_chunks:
        hits = st.fallback_diverse_excerpts(max_docs=5, max_len=2_500)
    if (not hits) and udn and (not st.has_chunks):
        # App DB says files exist, but this Python has no RAG data (wrong host / wiped volume / ingest went elsewhere)
        return {
            "rag_context": (
                "SYNC_INFO: The app lists these files as indexed, but this agent has no text index for your account on disk: "
                + ", ".join(udn)
                + ". The PDF must be re-uploaded while this python-agents service is running, or LANGGRAPH_AGENT_URL must point "
                "at the same server that received the file. Do not state that the user failed to upload."
            ),
            "rag_citations": udn,
        }
    if not hits:
        return {
            "rag_context": "(No relevant passages in uploaded documents for this question.)",
            "rag_citations": [] if (not udn) else udn,
        }
    lines: list[str] = []
    names: list[str] = []
    for h in hits:
        name = h.get("source_name") or "document"
        names.append(name)
        lines.append(f"[{name}]\n{h.get('text', '')}")
    uniq: list[str] = []
    for n in names:
        if n not in uniq:
            uniq.append(n)
    return {
        "rag_context": "\n\n---\n\n".join(lines),
        "rag_citations": uniq[:8],
    }


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
            )
        )
        if (not nav) and fileish and intent in ("app_help", "general", "recommend"):
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
        "If RETRIEVED SOURCES (uploads) are present and match the topic, base questions on that material. "
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
        "You are a learning coach for SESA. Using the live dashboard JSON and any RETRIEVED SOURCES, suggest concrete, personalized next steps "
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
    """Answer mainly from RAG chunks when the user asks about their uploaded files."""
    udn = list(state.get("user_document_names") or [])
    if not state.get("use_rag"):
        return {
            "reply": (
                "To answer from your own files, turn on “Use my documents” in this assistant, "
                "and make sure you have uploaded documents (enrolled students only). "
                "Then ask your question again."
            ),
        }
    rctx = (state.get("rag_context") or "").strip()
    if rctx.startswith("(RAG index"):
        return {
            "reply": "The document search index is temporarily unavailable. Please try again in a moment.",
        }
    if rctx.startswith("(No relevant"):
        if udn:
            return {
                "reply": (
                    f"I have your indexed file(s) ({', '.join(udn)}), but that question did not match any text passage. "
                    "Try: paste 5–10 words that appear in the PDF, or ask: “Summarize the document in 5 bullet points” or “What are the key definitions?”"
                ),
            }
        return {
            "reply": (
                "I could not find relevant text in your uploaded documents for that question. "
                "Try rephrasing with key words from the file, or upload the PDF again and wait for status “indexed”."
            ),
        }
    rblock = _rag_block(state)
    if not rblock and udn:
        return {
            "reply": (
                f"Your app lists: {', '.join(udn)}, but I could not load text. "
                "Re-upload the file with the agent service (python-agents) running, then ask again."
            ),
        }
    if not rblock:
        return {
            "reply": (
                "I do not have usable excerpts from your files for this. "
                "Add a document (PDF, Word, or text) and check that it finished indexing, then try again."
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
        "NEVER state that the user has no upload if USERFILES or RETRIEVED SOURCES / SYNC_INFO shows files. "
        "Do not replace this with a generic dashboard/JSON walkthrough unless the user asked about the SESA app UI. "
        "For SYNC_INFO, explain the server/index mismatch in plain language and what to do (re-upload with agent running). "
        "Otherwise use RETRIEVED SOURCES: quote or paraphrase; name the file in brackets. Do not invent facts not in the sources.\n"
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
        "When RETRIEVED SOURCES (uploaded file excerpts) are present and on-topic, use them to answer fact questions about that material. "
        if has_rag
        else ""
    )
    sys = (
        AGENT_PERSONA
        + "\n\n"
        "You are SafeEdu SESA assistant: helpful, concise, friendly. "
        + rag_line
        + "You may reference dashboard JSON and RETRIEVED SOURCES to personalize and ground answers. "
        "If the user might benefit from a structured quiz or next-step plan, you may briefly offer those as follow-ups, but answer their actual question first.\n"
        + dash
        + _rag_block(state)
        + _mode_suffix(state)
    )
    text = llm.invoke(_chat_messages(state, sys)).content
    return {"reply": str(text).strip()}


def build_graph():
    """
    Personal assistant graph: RAG attach → intent router → optional live dashboard refresh
    (app_help, recommend, quiz) → specialist node. Intents map to “tools” conceptually:
    app help, dynamic quiz JSON, dashboard-grounded recommendations, document QA, general.
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
