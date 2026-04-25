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
from app.sesa_context import APP_GUIDE


class RouterOut(BaseModel):
    intent: Literal["app_help", "quiz", "recommend", "general"] = Field(
        description="app_help=how to use the product; quiz=user wants practice questions generated; recommend=what to learn or do next from dashboard; general=other."
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
    if not rctx or rctx.startswith("(No relevant"):
        return ""
    return "\n\n--- RETRIEVED SOURCES (user-uploaded documents) ---\n" + rctx


def _mode_suffix(state: AgentState) -> str:
    return "\n\n" + _response_mode_extras(str(state.get("response_mode") or "default"))


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
    sys = (
        "Classify the user's latest message for an educational web app.\n"
        "- app_help: how to navigate, enroll, pay, certificates, dashboard widgets, or where to find a feature.\n"
        "- quiz: user wants quiz/practice questions, MCQ, test prep, or 'drill me'.\n"
        "- recommend: what course to take next, what to study, priorities based on progress (needs dashboard context).\n"
        "- general: everything else (small talk, vague questions answerable without heavy dashboard use).\n"
        "Return only the structured intent field."
    )
    out = llm.invoke([SystemMessage(content=sys), HumanMessage(content=text)])
    return {"intent": out.intent}


def attach_rag_node(state: AgentState) -> dict[str, Any]:
    from app.rag.bm25_store import search_user_rag

    if not state.get("use_rag"):
        return {"rag_context": "", "rag_citations": []}
    uid = (state.get("user_id") or "").strip()
    if not uid:
        return {"rag_context": "", "rag_citations": []}
    q = (state.get("user_message") or "").strip()
    if not q:
        return {"rag_context": "", "rag_citations": []}
    try:
        hits = search_user_rag(uid, q, top_k=5)
    except Exception:
        return {"rag_context": "(RAG index unavailable.)", "rag_citations": []}
    if not hits:
        return {
            "rag_context": "(No relevant passages in uploaded documents for this question.)",
            "rag_citations": [],
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
    if intent in ("app_help", "quiz", "recommend", "general"):
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
    if intent not in ("recommend", "app_help"):
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
        APP_GUIDE
        + "\n\nCurrent user role: "
        + state.get("role", "student")
        + "\nDashboard snapshot (JSON):\n"
        + dash
        + _rag_block(state)
        + _mode_suffix(state)
        + "\nGive short, actionable steps. Mention quickActions routes when relevant."
    )
    text = llm.invoke(
        [
            SystemMessage(content=sys),
            HumanMessage(content=state["user_message"]),
        ]
    ).content
    return {"reply": str(text).strip()}


def quiz_node(state: AgentState) -> dict[str, Any]:
    llm = _llm()
    dash = _dash_str(state)
    sys = (
        "You write educational quiz JSON for the SESA app. "
        "Use the user's message as the topic. If the dashboard lists enrolled or recommended courses, prefer those titles when relevant.\n"
        "When RETRIEVED SOURCES are given, base questions on that material when it fits the topic.\n"
        "Respond with a single JSON object ONLY, no markdown, shape:\n"
        '{"questions":[{"question":"str","type":"multiple_choice|true_false|short_answer","options":["A","B","C","D"] or [],"correct_answer":0 or "text","explanation":"str","difficulty":"easy|medium|hard"}]}\n'
        f"Dashboard JSON (may be partial):\n{dash}"
        + _rag_block(state)
        + _mode_suffix(state)
    )
    raw = llm.invoke(
        [SystemMessage(content=sys), HumanMessage(content=state["user_message"])]
    ).content
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
        "You are a learning coach for SESA. Using the dashboard JSON and any RETRIEVED SOURCES, suggest concrete next steps "
        "(which course to open, whether to browse recommendations, certificates to pursue, or time on in-progress courses). "
        "Also output structured recommendations as JSON embedded in your answer in this exact pattern on the last line:\n"
        "RECOMMENDATIONS_JSON::"
        '[{"title":"...","reason":"...","courseId":"optional id from snapshot"}]\n'
        "The last line must start with RECOMMENDATIONS_JSON:: followed by valid JSON array."
        "\nDashboard:\n"
        + dash
        + _rag_block(state)
        + _mode_suffix(state)
    )
    text = llm.invoke(
        [
            SystemMessage(content=sys),
            HumanMessage(content=state["user_message"]),
        ]
    ).content
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


def general_node(state: AgentState) -> dict[str, str]:
    llm = _llm()
    dash = _dash_str(state)
    sys = (
        "You are SafeEdu SESA assistant: helpful, concise, friendly. "
        "You may reference dashboard JSON and RETRIEVED SOURCES to personalize and ground answers.\n"
        + dash
        + _rag_block(state)
        + _mode_suffix(state)
    )
    mode = (state.get("response_mode") or "default").lower()
    limit = 12 if mode in ("conversation", "conversation_history") else 6
    hist = state.get("conversation_history") or []
    msgs = [SystemMessage(content=sys)]
    for turn in hist[-limit:]:
        role = turn.get("role", "user")
        content = turn.get("content", "")
        if role == "assistant":
            msgs.append(SystemMessage(content="Previous assistant: " + content[:1500]))
        else:
            msgs.append(HumanMessage(content=content[:1500]))
    msgs.append(HumanMessage(content=state["user_message"]))
    text = llm.invoke(msgs).content
    return {"reply": str(text).strip()}


def build_graph():
    g = StateGraph(AgentState)
    g.add_node("attach_rag", attach_rag_node)
    g.add_node("router", router_node)
    g.add_node("refresh_context", refresh_dashboard_node)
    g.add_node("app_help", app_help_node)
    g.add_node("quiz", quiz_node)
    g.add_node("recommend", recommend_node)
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
            "general": "general",
        },
    )
    g.add_edge("app_help", END)
    g.add_edge("quiz", END)
    g.add_edge("recommend", END)
    g.add_edge("general", END)
    return g.compile()


GRAPH = build_graph()
