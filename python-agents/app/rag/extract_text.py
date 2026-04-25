"""Best-effort text extraction from user uploads (many extensions)."""

from __future__ import annotations

import csv
import io
import json
import re
from io import BytesIO
from pathlib import Path


def _strip_html(data: bytes) -> str:
    t = data.decode("utf-8", errors="replace")
    t = re.sub(r"<script[^>]*>.*?</script>", " ", t, flags=re.DOTALL | re.IGNORECASE)
    t = re.sub(r"<style[^>]*>.*?</style>", " ", t, flags=re.DOTALL | re.IGNORECASE)
    t = re.sub(r"<[^>]+>", " ", t)
    return re.sub(r"\s+", " ", t).strip()


def _text_plain(data: bytes) -> str:
    return data.decode("utf-8", errors="replace").strip()


def extract_text_from_bytes(filename: str, data: bytes) -> str:
    ext = Path(filename or "file").suffix.lower() or ".txt"
    name = (filename or "file").lower()

    if ext in (".txt", ".md", ".log", ".env") or name.endswith(".md"):
        return _text_plain(data)
    if ext in (".json",):
        try:
            j = json.loads(data.decode("utf-8", errors="replace"))
            return json.dumps(j, ensure_ascii=False, indent=2)[:1_000_000]
        except Exception:
            return _text_plain(data)
    if ext in (".yml", ".yaml",):
        return _text_plain(data)
    if ext in (".html", ".htm", ".xml"):
        return _strip_html(data)
    if ext == ".csv":
        sio = io.StringIO(data.decode("utf-8", errors="replace"))
        rows: list[str] = []
        try:
            for row in csv.reader(sio):
                rows.append(" | ".join(str(c) for c in row))
        except Exception:
            return _text_plain(data)
        return "\n".join(rows)[:1_000_000]
    if ext == ".pdf":
        from pypdf import PdfReader

        r = PdfReader(BytesIO(data))
        parts: list[str] = []
        for page in r.pages:
            t = page.extract_text() or ""
            parts.append(t)
        return "\n".join(parts).strip()
    if ext == ".docx":
        from docx import Document

        d = Document(BytesIO(data))
        return "\n".join(p.text for p in d.paragraphs if p.text.strip()).strip()

    # Fallback: try utf-8 text
    try:
        sample = _text_plain(data)
        if len(sample) > 20:
            return sample
    except Exception:
        pass
    raise ValueError(f"Unsupported or empty file type: {ext}")


# Extension groups for docs / error messages
SUPPORTED_TEXT_EXTENSIONS = (
    ".txt", ".md", ".pdf", ".docx", ".html", ".htm", ".csv", ".json", ".yml", ".yaml", ".xml", ".log",
)
