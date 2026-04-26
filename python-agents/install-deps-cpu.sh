#!/usr/bin/env bash
# CPU-only PyTorch + project deps. Avoids multi‑GB nvidia-cudnn / CUDA wheels
# (default Linux pip “torch” often pulls these and times out on slow networks).
#
# Usage (from this directory, with venv active or uv on PATH):
#   chmod +x install-deps-cpu.sh
#   ./install-deps-cpu.sh
#
# Optional: UV_HTTP_TIMEOUT=600 ./install-deps-cpu.sh
set -euo pipefail
cd "$(dirname "$0")"
export UV_HTTP_TIMEOUT="${UV_HTTP_TIMEOUT:-300}"

if command -v uv >/dev/null 2>&1; then
  # 1) Smaller CPU-only torch from PyTorch (not the default CUDA stack on PyPI)
  uv pip install torch --index-url https://download.pytorch.org/whl/cpu
  # 2) Rest of RAG / agent — sentence-transformers should keep the torch above
  uv pip install -r requirements.txt
else
  python3 -m pip install --upgrade pip
  python3 -m pip install torch --index-url https://download.pytorch.org/whl/cpu
  python3 -m pip install -r requirements.txt
fi

echo "Done. Check:  python -c \"import torch; print('torch', torch.__version__)\""
