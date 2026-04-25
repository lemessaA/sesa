"""Per-user BM25 index with JSON persistence; chunking and search."""

from __future__ import annotations

import json
import os
import re
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from rank_bm25 import BM25Okapi

# Relative to package parent (python-agents/)
def _data_root() -> Path:
    base = os.environ.get("RAG_DATA_DIR", "").strip()
    if base:
        return Path(base)
    return Path(__file__).resolve().parent.parent.parent / "data" / "rag"


def _user_dir(user_id: str) -> Path:
    safe = re.sub(r"[^\w\-.]+", "_", user_id)[:200]
    p = _data_root() / safe
    p.mkdir(parents=True, exist_ok=True)
    return p


@dataclass
class RAGStore:
    user_id: str
    chunks: list[dict[str, Any]]

    @classmethod
    def load(cls, user_id: str) -> "RAGStore":
        path = _user_dir(user_id) / "store.json"
        if not path.exists():
            return cls(user_id=user_id, chunks=[])
        try:
            raw = json.loads(path.read_text(encoding="utf-8"))
            chunks = raw.get("chunks") or []
            if not isinstance(chunks, list):
                chunks = []
            return cls(user_id=user_id, chunks=chunks)
        except Exception:
            return cls(user_id=user_id, chunks=[])

    def save(self) -> None:
        path = _user_dir(self.user_id) / "store.json"
        path.write_text(
            json.dumps({"version": 1, "user_id": self.user_id, "chunks": self.chunks}, ensure_ascii=False, indent=0),
            encoding="utf-8",
        )

    @staticmethod
    def _tokenize(text: str) -> list[str]:
        return re.findall(r"[\w\u0080-\uFFFF]+", text.lower(), flags=re.UNICODE) or [text.lower()]

    def _bm25(self) -> BM25Okapi | None:
        if not self.chunks:
            return None
        tokenized = [self._tokenize(c.get("text", "")) for c in self.chunks]
        if not any(tokenized):
            return None
        return BM25Okapi(tokenized)

    def _chunk_text(self, text: str, size: int = 900, overlap: int = 150) -> list[str]:
        t = text.strip()
        if not t:
            return []
        if len(t) <= size:
            return [t]
        out: list[str] = []
        i = 0
        while i < len(t):
            piece = t[i : i + size]
            out.append(piece)
            if i + size >= len(t):
                break
            i += size - overlap
        return out

    def add_document(
        self,
        source_doc_id: str,
        source_name: str,
        full_text: str,
        max_chunks_per_doc: int = 500,
    ) -> int:
        # Remove any existing chunks for this document id
        self.chunks = [c for c in self.chunks if c.get("source_doc_id") != source_doc_id]
        pieces = self._chunk_text(full_text)
        n = 0
        for piece in pieces[:max_chunks_per_doc]:
            self.chunks.append(
                {
                    "id": str(uuid.uuid4()),
                    "text": piece,
                    "source_doc_id": source_doc_id,
                    "source_name": source_name,
                }
            )
            n += 1
        self.save()
        return n

    def remove_document(self, source_doc_id: str) -> int:
        before = len(self.chunks)
        self.chunks = [c for c in self.chunks if c.get("source_doc_id") != source_doc_id]
        self.save()
        return before - len(self.chunks)

    def clear_user(self) -> None:
        self.chunks = []
        self.save()

    def search(self, query: str, top_k: int = 5) -> list[dict[str, Any]]:
        if not query.strip() or not self.chunks:
            return []
        bm = self._bm25()
        if bm is None:
            return []
        q_tokens = self._tokenize(query)
        if not q_tokens:
            return []
        scores = bm.get_scores(q_tokens)
        ranked = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[: top_k]
        out: list[dict[str, Any]] = []
        for i in ranked:
            c = self.chunks[i]
            out.append(
                {
                    "text": c.get("text", "")[:3000],
                    "source_name": c.get("source_name", "document"),
                    "source_doc_id": c.get("source_doc_id", ""),
                    "score": float(scores[i]),
                }
            )
        return out


def search_user_rag(user_id: str, query: str, top_k: int = 5) -> list[dict[str, Any]]:
    return RAGStore.load(user_id).search(query, top_k=top_k)


def ingest_user_document(
    user_id: str, source_doc_id: str, source_name: str, full_text: str, max_total_chunks: int = 4000
) -> int:
    store = RAGStore.load(user_id)
    n = store.add_document(source_doc_id, source_name, full_text)
    if len(store.chunks) > max_total_chunks:
        store.chunks = store.chunks[-max_total_chunks:]
        store.save()
    return n
