"""HTTP callbacks into the Node API (e.g. fresh dashboard for LangGraph)."""

from __future__ import annotations

import json
import urllib.error
import urllib.request
from typing import Any


def fetch_agent_dashboard_from_backend(api_base: str, user_id: str) -> dict[str, Any]:
    """
    POST {api_base}/v1/agent/internal/dashboard-context with JSON { "userId": "..." }.
    api_base should be like http://127.0.0.1:5000/api (no trailing slash required).
    """
    base = api_base.rstrip("/")
    url = f"{base}/v1/agent/internal/dashboard-context"
    payload = json.dumps({"userId": user_id}).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=45) as resp:
            body = resp.read().decode("utf-8")
            data = json.loads(body) if body else {}
            if not isinstance(data, dict):
                return {}
            # REST: { "data": { "context": { ... } } }
            ctx = data.get("data", {}).get("context")
            if isinstance(ctx, dict) and ctx:
                return ctx
            return data
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="replace")[:500]
        raise RuntimeError(f"Backend HTTP {e.code}: {detail}") from e
