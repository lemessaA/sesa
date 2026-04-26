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
exec uvicorn app.main:app --host 127.0.0.1 --port "$AGENT_PORT" --reload
