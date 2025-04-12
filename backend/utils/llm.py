from openai import OpenAI
import os
from typing import List

# Set up the Upstage client
UPSTAGE_API_KEY = os.getenv("UPSTAGE_API_KEY")
if not UPSTAGE_API_KEY:
    raise ValueError("UPSTAGE_API_KEY not set in environment.")

client = OpenAI(
    api_key=UPSTAGE_API_KEY,
    base_url="https://api.upstage.ai/v1"
)

def chat_with_context(query: str, chunks: List[str]) -> str:
    """
    Sends the query and relevant context chunks to the Solar LLM.

    Parameters:
    - query: User's question
    - chunks: List of relevant chunk texts

    Returns:
    - LLM response string
    """
    context_text = "\n".join([f"- Chunk {i+1}: {chunk}" for i, chunk in enumerate(chunks)])

    messages = [
        {
            "role": "system",
            "content": (
                "You are a helpful assistant. Use the context below to answer the user's question. "
                "If the answer is not in the context, say you don't know."
            )
        },
        {
            "role": "user",
            "content": f"Context:\n{context_text}\n\nQuestion: {query}"
        }
    ]

    response = client.chat.completions.create(
        model="solar-pro",
        messages=messages
    )
    return response.choices[0].message["content"]
