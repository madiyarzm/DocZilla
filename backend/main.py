import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import CORS_ORIGINS, UPSTAGE_API_KEY, UPSTAGE_MODEL
from routes.chat import chat_router
from routes.compliance import compliance_router
from routes.policy import policy_router
from routes.query import query_router
from routes.slack import slack_router
from routes.trending import trending_router
from routes.upload import upload_router

app = FastAPI(title="DocZilla – Agentic Compliance Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload_router)
app.include_router(query_router)
app.include_router(chat_router)
app.include_router(slack_router)
app.include_router(policy_router)
app.include_router(compliance_router)
app.include_router(trending_router)


@app.get("/", tags=["System"])
def root():
    return {
        "app": "DocZilla",
        "status": "ok",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health", tags=["System"])
def health():
    from utils.embeddings import backend_name

    return {
        "status": "ok",
        "model": UPSTAGE_MODEL,
        "upstage_configured": bool(UPSTAGE_API_KEY),
        "embedding_backend": backend_name(),
    }


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8001"))
    uvicorn.run(app, host="0.0.0.0", port=port)
