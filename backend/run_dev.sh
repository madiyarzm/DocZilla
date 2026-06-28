#!/usr/bin/env bash
# Start DocZilla API on port 8001 (8000 is often taken by other local apps).
set -euo pipefail
cd "$(dirname "$0")"
PORT="${PORT:-8001}"
exec uvicorn main:app --reload --host 127.0.0.1 --port "$PORT"
