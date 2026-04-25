"""Deprecated: use `app.rag.vector_store` (Chroma + embeddings). Re-exported for compatibility."""

from app.rag.vector_store import RAGStore, ingest_user_document, search_user_rag

__all__ = ["RAGStore", "ingest_user_document", "search_user_rag"]
