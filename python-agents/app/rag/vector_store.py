"""RAG routing: Qdrant (default when QDRANT_URL set), MongoDB, or local Chroma."""

from __future__ import annotations

import os
from typing import Any

__all__ = [
    "RAGStore",
    "_use_mongo_backend",
    "active_rag_backend",
    "search_user_rag",
    "ingest_user_document",
]


def _qdrant_configured() -> bool:
    return bool((os.environ.get("QDRANT_URL") or os.environ.get("RAG_QDRANT_URL") or "").strip())


def _mongo_configured() -> bool:
    return bool((os.environ.get("MONGODB_URI") or os.environ.get("MONGO_URI") or "").strip())


def active_rag_backend() -> str:
    """
    effective backend: qdrant | mongo | chroma
    RAG_VECTOR_BACKEND: auto|qdrant|mongo|chroma
    auto: Qdrant if QDRANT_URL set, else Mongo if MONGO_URI set, else Chroma
    """
    mode = (os.environ.get("RAG_VECTOR_BACKEND") or "auto").strip().lower()
    if mode == "qdrant":
        if not _qdrant_configured():
            raise RuntimeError(
                "RAG_VECTOR_BACKEND=qdrant requires QDRANT_URL or RAG_QDRANT_URL (e.g. http://127.0.0.1:6333)."
            )
        return "qdrant"
    if mode == "mongo":
        if not _mongo_configured():
            raise RuntimeError(
                "RAG_VECTOR_BACKEND=mongo requires MONGO_URI or MONGODB_URI in the agent environment."
            )
        return "mongo"
    if mode == "chroma":
        return "chroma"
    if _qdrant_configured():
        return "qdrant"
    if _mongo_configured():
        return "mongo"
    return "chroma"


def _use_mongo_backend() -> bool:
    return active_rag_backend() == "mongo"


class RAGStore:
    """
    Vectors: Qdrant (set QDRANT_URL) by default in auto, or force RAG_VECTOR_BACKEND;
    or Mongo (Atlas / cosine) when MONGO_URI is set and not using Qdrant; else Chroma on disk.
    """

    @staticmethod
    def load(user_id: str) -> Any:
        b = active_rag_backend()
        if b == "mongo":
            from app.rag.mongo_rag import MongoRAGStore

            return MongoRAGStore.load(user_id)
        if b == "qdrant":
            from app.rag.qdrant_rag import QdrantRAGStore

            return QdrantRAGStore.load(user_id)
        from app.rag.chroma_rag import ChromaRAGStore

        return ChromaRAGStore.load(user_id)


def search_user_rag(user_id: str, query: str, top_k: int = 5) -> list[dict[str, Any]]:
    b = active_rag_backend()
    if b == "mongo":
        from app.rag.mongo_rag import search_user_rag_mongo

        return search_user_rag_mongo(user_id, query, top_k=top_k)
    if b == "qdrant":
        from app.rag.qdrant_rag import search_user_rag_qdrant

        return search_user_rag_qdrant(user_id, query, top_k=top_k)
    from app.rag.chroma_rag import search_user_rag_chroma

    return search_user_rag_chroma(user_id, query, top_k=top_k)


def ingest_user_document(
    user_id: str, source_doc_id: str, source_name: str, full_text: str, max_total_chunks: int = 4000
) -> int:
    b = active_rag_backend()
    if b == "mongo":
        from app.rag.mongo_rag import ingest_user_document_mongo

        return ingest_user_document_mongo(
            user_id, source_doc_id, source_name, full_text, max_total_chunks=max_total_chunks
        )
    if b == "qdrant":
        from app.rag.qdrant_rag import ingest_user_document_qdrant

        return ingest_user_document_qdrant(
            user_id, source_doc_id, source_name, full_text, max_total_chunks=max_total_chunks
        )
    from app.rag.chroma_rag import ingest_user_document_chroma

    return ingest_user_document_chroma(
        user_id, source_doc_id, source_name, full_text, max_total_chunks=max_total_chunks
    )
