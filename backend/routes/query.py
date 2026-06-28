"""Raw retrieval endpoint — returns the top matching chunks with metadata."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from utils.citations import build_citations
from utils.stores import get_main_store
from utils.trending import record_query

query_router = APIRouter()


class QueryPayload(BaseModel):
    query: str
    k: int = 5


@query_router.post("/query", tags=["Query"])
async def query_documents(payload: QueryPayload):
    if not payload.query.strip():
        raise HTTPException(status_code=400, detail="Empty query.")
    record_query(payload.query)
    results = get_main_store().search(payload.query, k=payload.k)
    return {
        "query": payload.query,
        "relevant_chunks": results,
        "citations": build_citations(results),
    }
