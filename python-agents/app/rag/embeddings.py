"""Shared sentence-transformer for Mongo vector rows and query embedding."""

from __future__ import annotations

import os
from typing import Any

import numpy as np

_model: Any = None


def get_model_name() -> str:
    return os.environ.get("RAG_EMBEDDING_MODEL", "all-MiniLM-L6-v2").strip() or "all-MiniLM-L6-v2"


def get_model() -> Any:
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer

        _model = SentenceTransformer(get_model_name())
    return _model


def embed_texts(texts: list[str], normalize: bool = True) -> np.ndarray:
    if not texts:
        return np.zeros((0, 0), dtype=np.float32)
    m = get_model()
    return m.encode(
        texts,
        convert_to_numpy=True,
        normalize_embeddings=normalize,
        show_progress_bar=False,
    )


def embed_query(q: str, normalize: bool = True) -> np.ndarray:
    return embed_texts([q], normalize=normalize)[0]
