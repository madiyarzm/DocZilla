"""Trending FAQs (Phase 6) — in-memory; resets on restart."""
from fastapi import APIRouter

from utils.trending import top_questions

trending_router = APIRouter()


@trending_router.post("/api/trending", tags=["Trending"])
@trending_router.get("/api/trending", tags=["Trending"])
async def trending(limit: int = 10):
    return {
        "note": "In-memory counts for this server session; reset on restart. "
        "Production would use Redis.",
        "trending": top_questions(limit=limit),
    }
