"""Central configuration loaded from environment variables.

Nothing here raises at import time so the app can boot (and serve /health)
even when a key is missing — individual features report a clear error instead.
"""
import os
from dotenv import load_dotenv

load_dotenv()

UPSTAGE_API_KEY = os.getenv("UPSTAGE_API_KEY", "")
SLACK_WEBHOOK_URL = os.getenv("SLACK_WEBHOOK_URL", "")

# Upstage Solar reasoning model — used for ALL LLM calls (compliance loop,
# chat, summaries). solar-pro3 is the flagship reasoning model.
UPSTAGE_MODEL = os.getenv("UPSTAGE_MODEL", "solar-pro3")
UPSTAGE_BASE_URL = os.getenv("UPSTAGE_BASE_URL", "https://api.upstage.ai/v1")
# Reasoning depth: "low" | "medium" | "high". Higher = slower but more accurate.
UPSTAGE_REASONING_EFFORT = os.getenv("UPSTAGE_REASONING_EFFORT", "medium")

# Local dev origins are always allowed so the browser can call the backend
# directly (bypassing the Next proxy, which times out long requests). Any
# origins set via the CORS_ORIGINS env var are added on top (e.g. production).
_DEV_ORIGINS = [
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
CORS_ORIGINS = list(
    dict.fromkeys(
        _DEV_ORIGINS
        + [o.strip() for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()]
    )
)

# Where parsed text + vector stores live (relative to backend/).
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
VECTOR_DIR = os.path.join(os.path.dirname(__file__), "vector_store")
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(VECTOR_DIR, exist_ok=True)
