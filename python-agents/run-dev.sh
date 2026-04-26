#!/usr/bin/env bash
# Local dev: ensure python-agents/.env exists (load_dotenv in app reads it at runtime).
# Same deps also enable: `fastapi dev` from this directory.
set -euo pipefail
cd "$(dirname "$0")"
if [[ ! -f .env ]]; then
  echo "Missing python-agents/.env — copy from .env.example: cp .env.example .env" >&2
  exit 1
fi
# Must match backend LANGGRAPH_AGENT_URL (default 8088)
export AGENT_PORT="${AGENT_PORT:-8088}"
export PYTHONPATH=.

# Prefer a local venv (PEP 668 on many distros blocks system `pip install`)
VENV_DIR="${VENV_DIR:-$PWD/.venv}"
if [[ -x "$VENV_DIR/bin/python" ]]; then
  PY="$VENV_DIR/bin/python"
else
  PY="${PYTHON:-python3}"
fi
if ! "$PY" -c "import pypdf" 2>/dev/null; then
  echo "Missing dependency: pypdf (required for .pdf RAG). Install requirements into a venv, then retry:" >&2
  echo "  cd $(pwd) && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt" >&2
  exit 1
fi

exec "$PY" -m uvicorn app.main:app --host 127.0.0.1 --port "$AGENT_PORT" --reload
