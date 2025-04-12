from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Загружаем переменные окружения из файла .env
load_dotenv()

from routes.upload import upload_router
from routes.slack import router as slack_router
# from routes.query import query_router
# from routes.actions import actions_router
from routes.query import query_router
from routes.chat import chat_router

app = FastAPI(title="Echo – Contract Assistant")

# Register routers
app.include_router(upload_router)
app.include_router(query_router)
app.include_router(chat_router)


# Allowed frontend URLs
origins = [
    "http://localhost:3000",      # Local dev
    "http://127.0.0.1:3000",     # Alternative local dev
    "http://localhost:5173",     # Vite dev server
    "http://localhost:3001",     # Next.js alternative port
    "http://10.10.5.238:3001",   # Network Next.js
    # "https://www.echodoc.app",  # Production
]

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=3600,
)

# Register routers
app.include_router(upload_router)
app.include_router(slack_router, prefix="/api/slack", tags=["slack"])
# app.include_router(query_router)
# app.include_router(actions_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
