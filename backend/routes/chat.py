"""Chat over uploaded documents — Solar reasoning + mandatory citations (Phase 4)."""
from fastapi import APIRouter, HTTPException

from schemas.chat_payload import ChatPayload, Message
from utils.llm_client import complete
from utils.citations import build_citations
from utils.stores import get_main_store
from utils.trending import record_query

chat_router = APIRouter()

NO_SOURCE = "I could not find a source for this in the uploaded documents."

SYSTEM = (
    "You are DocZilla, a compliance document assistant. Answer the user's "
    "question using ONLY the provided document excerpts. Each excerpt is tagged "
    "with [filename | section | clause N | page P]. Cite the specific clause(s) "
    "you used inline, e.g. (clause 3). If the excerpts do not contain the "
    f"answer, reply EXACTLY with: \"{NO_SOURCE}\" and nothing else. Never invent "
    "facts that are not in the excerpts."
)


def _format_context(results):
    blocks = []
    for r in results:
        m = r["metadata"]
        tag = (
            f"[{m.get('filename')} | {m.get('section')} | "
            f"clause {m.get('clause_id')} | page {m.get('page')}]"
        )
        blocks.append(f"{tag}\n{r['content']}")
    return "\n\n".join(blocks)


@chat_router.post("/chat", tags=["Chat"])
async def chat(payload: ChatPayload):
    messages = payload.messages
    last_user = next(
        (m.content for m in reversed(messages) if m.role == "user"), None
    )
    if not last_user:
        raise HTTPException(status_code=400, detail="No user message found.")

    record_query(last_user)

    store = get_main_store()
    results = store.search(last_user, k=5)
    citations = build_citations(results)

    if not results:
        answer = NO_SOURCE
        updated = messages + [Message(role="assistant", content=answer)]
        return {"messages": [m.dict() for m in updated], "citations": []}

    context = _format_context(results)
    convo = [
        {"role": m.role, "content": m.content}
        for m in messages
        if m.role in ("user", "assistant")
    ]
    convo[-1]["content"] = (
        f"Document excerpts:\n{context}\n\nQuestion: {last_user}"
    )

    try:
        answer = complete(SYSTEM, convo, max_tokens=1024)
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))

    served_citations = [] if answer.strip() == NO_SOURCE else citations
    updated = messages + [Message(role="assistant", content=answer)]
    return {
        "messages": [m.dict() for m in updated],
        "citations": served_citations,
    }
