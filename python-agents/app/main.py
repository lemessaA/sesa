"""FastAPI entrypoint for the LangGraph SESA personal agent."""

from __future__ import annotations

import asyncio
import os
from pathlib import Path

from dotenv import load_dotenv

# Load python-agents/.env before any code reads os.environ (must precede `app.graph` import).
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from fastapi import APIRouter, FastAPI, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field

from app.graph import GRAPH
from app.rag.vector_store import RAGStore, ingest_user_document
from app.rag.extract_text import SUPPORTED_TEXT_EXTENSIONS, extract_text_from_bytes

app = FastAPI(
    title="SESA LangGraph Agent",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    description="Internal LLM service. In production, traffic should come from the SESA Node API.",
)
v1 = APIRouter(prefix="/v1", tags=["agent"])
rag = APIRouter(prefix="/v1/rag", tags=["rag"])


class InvokeBody(BaseModel):
    user_message: str = Field(..., min_length=1, max_length=8000)
    role: str = "student"
    user_name: str | None = None
    user_id: str | None = None
    dashboard_context: dict = Field(default_factory=dict)
    conversation_history: list[dict] = Field(default_factory=list)
    use_rag: bool = False
    response_mode: str = "default"
    # From Node: indexed upload filenames (same user_id as RAG store)
    user_document_names: list[str] = Field(default_factory=list)
    # tutorial | research | conversation | conversation_history | default

    @property
    def response_mode_norm(self) -> str:
        m = (self.response_mode or "default").strip().lower()
        if m in ("conversation_history", "conversation"):
            return "conversation"
        if m in ("tutorial", "research", "default"):
            return m
        return "default"


def _health_payload() -> dict:
    from app.rag.vector_store import active_rag_backend

    return {
        "data": {
            "status": "healthy",
            "api": {"name": "langgraph-agent", "version": "1"},
            "capabilities": {
                "groq": bool(os.environ.get("GROQ_API_KEY", "").strip()),
                "backendRefresh": bool(os.environ.get("BACKEND_INTERNAL_API_BASE", "").strip()),
                "rag": True,
                "ragVectorBackend": active_rag_backend(),
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


@rag.get("/supported-types")
def rag_supported():
    return {"extensions": list(SUPPORTED_TEXT_EXTENSIONS)}


@rag.post("/ingest")
async def rag_ingest(
    file: UploadFile = File(...),
    user_id: str = Form(...),
    document_id: str = Form(...),
    original_name: str = Form(""),
):
    if not (user_id or "").strip() or not (document_id or "").strip():
        raise HTTPException(400, "user_id and document_id are required")
    raw = await file.read()
    max_b = 20 * 1024 * 1024
    if len(raw) > max_b:
        raise HTTPException(413, f"File too large (max {max_b // (1024 * 1024)}MB)")
    name = (original_name or file.filename or "upload").strip()
    try:
        text = extract_text_from_bytes(name, raw)
    except Exception as e:  # noqa: BLE001
        raise HTTPException(400, f"Could not read document: {e!s}") from e
    if not (text and text.strip()):
        raise HTTPException(400, "No extractable text in file")
    if len(text) > 1_000_000:
        text = text[:1_000_000] + "\n\n[...truncated for indexing]"
    try:
        n = ingest_user_document(user_id.strip(), document_id.strip(), name, text)
    except Exception as e:  # noqa: BLE001
        raise HTTPException(500, f"RAG indexing failed: {e!s}") from e
    return {"ok": True, "document_id": document_id.strip(), "chunks_indexed": n}


@rag.delete("/documents/{user_id}/{document_id}")
def rag_delete_document(user_id: str, document_id: str):
    st = RAGStore.load(user_id)
    removed = st.remove_document(document_id)
    return {"ok": True, "chunks_removed": removed}


async def _run_completion(body: InvokeBody) -> dict:
    initial = {
        "user_message": body.user_message,
        "role": body.role,
        "user_name": body.user_name or "",
        "user_id": (body.user_id or "").strip(),
        "dashboard_context": body.dashboard_context or {},
        "conversation_history": body.conversation_history or [],
        "use_rag": bool(body.use_rag),
        "response_mode": body.response_mode_norm,
        "user_document_names": [str(x) for x in (body.user_document_names or []) if str(x).strip()][:20],
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
        "rag_citations": result.get("rag_citations") or [],
    }


@v1.post("/messages")
async def post_messages_v1(body: InvokeBody):
    return await _run_completion(body)


@app.post("/invoke")
async def invoke_legacy(body: InvokeBody):
    """Deprecated: use POST /v1/messages."""
    return await _run_completion(body)


app.include_router(v1)
app.include_router(rag)
