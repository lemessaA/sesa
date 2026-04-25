"""RAG routing: MongoDB Atlas (when MONGO_URI set) or local Chroma. Chroma is imported lazily."""

from __future__ import annotations

import os
from typing import Any

__all__ = [
    "RAGStore",
    "_use_mongo_backend",
    "search_user_rag",
    "ingest_user_document",
]


def _use_mongo_backend() -> bool:
    mode = (os.environ.get("RAG_VECTOR_BACKEND") or "auto").strip().lower()
    if mode == "chroma":
        return False
    if mode == "mongo":
        u = (os.environ.get("MONGODB_URI") or os.environ.get("MONGO_URI") or "").strip()
        if not u:
            raise RuntimeError("RAG_VECTOR_BACKEND=mongo requires MONGO_URI or MONGODB_URI in the agent environment")
        return True
    return bool((os.environ.get("MONGODB_URI") or os.environ.get("MONGO_URI") or "").strip())


class RAGStore:
    """
    MongoDB (Atlas vector search or cosine on stored embeddings) when MONGO_URI is set;
    set RAG_VECTOR_BACKEND=chroma to use local Chroma only.
    """

    @staticmethod
    def load(user_id: str) -> Any:
        if _use_mongo_backend():
            from app.rag.mongo_rag import MongoRAGStore

            return MongoRAGStore.load(user_id)
        from app.rag.chroma_rag import ChromaRAGStore

        return ChromaRAGStore.load(user_id)


def search_user_rag(user_id: str, query: str, top_k: int = 5) -> list[dict[str, Any]]:
    if _use_mongo_backend():
        from app.rag.mongo_rag import search_user_rag_mongo

        return search_user_rag_mongo(user_id, query, top_k=top_k)
    from app.rag.chroma_rag import search_user_rag_chroma

    return search_user_rag_chroma(user_id, query, top_k=top_k)


def ingest_user_document(
    user_id: str, source_doc_id: str, source_name: str, full_text: str, max_total_chunks: int = 4000
) -> int:
    if _use_mongo_backend():
        from app.rag.mongo_rag import ingest_user_document_mongo

        return ingest_user_document_mongo(
            user_id, source_doc_id, source_name, full_text, max_total_chunks=max_total_chunks
        )
    from app.rag.chroma_rag import ingest_user_document_chroma

    return ingest_user_document_chroma(
        user_id, source_doc_id, source_name, full_text, max_total_chunks=max_total_chunks
    )
