"""FastAPI entrypoint for the LangGraph SESA personal agent."""

from __future__ import annotations

import asyncio
import os
from pathlib import Path

from dotenv import load_dotenv

# Load python-agents/.env before any code reads os.environ (must precede `app.graph` import).
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from fastapi import APIRouter, FastAPI, HTTPException
from pydantic import BaseModel, Field

from app.graph import GRAPH

app = FastAPI(
    title="SESA LangGraph Agent",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    description="Internal LLM service. In production, traffic should come from the SESA Node API.",
)
v1 = APIRouter(prefix="/v1", tags=["agent"])


class InvokeBody(BaseModel):
    user_message: str = Field(..., min_length=1, max_length=8000)
    role: str = "student"
    user_name: str | None = None
    user_id: str | None = None
    dashboard_context: dict = Field(default_factory=dict)
    conversation_history: list[dict] = Field(default_factory=list)


def _health_payload() -> dict:
    return {
        "data": {
            "status": "healthy",
            "api": {"name": "langgraph-agent", "version": "1"},
            "capabilities": {
                "groq": bool(os.environ.get("GROQ_API_KEY", "").strip()),
                "backendRefresh": bool(os.environ.get("BACKEND_INTERNAL_API_BASE", "").strip()),
            },
        }
    }


@app.get("/health")
def health_root():
    """Legacy root health (use GET /v1/health)."""
    return _health_payload()


@v1.get("/health")
def health_v1():
    return _health_payload()


async def _run_completion(body: InvokeBody) -> dict:
    initial = {
        "user_message": body.user_message,
        "role": body.role,
        "user_name": body.user_name or "",
        "user_id": (body.user_id or "").strip(),
        "dashboard_context": body.dashboard_context or {},
        "conversation_history": body.conversation_history or [],
    }
    try:
        result = await asyncio.to_thread(GRAPH.invoke, initial)
    except Exception as e:  # noqa: BLE001
        raise HTTPException(500, str(e)) from e

    return {
        "reply": result.get("reply") or "",
        "intent": result.get("intent") or "general",
        "quiz": result.get("quiz"),
        "recommendations": result.get("recommendations"),
    }


@v1.post("/messages")
async def post_messages_v1(body: InvokeBody):
    return await _run_completion(body)


@app.post("/invoke")
async def invoke_legacy(body: InvokeBody):
    """Deprecated: use POST /v1/messages."""
    return await _run_completion(body)


app.include_router(v1)
