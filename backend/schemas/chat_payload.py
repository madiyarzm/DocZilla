from pydantic import BaseModel, Field
from typing import List, Literal


class Message(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str


class ChatPayload(BaseModel):
    messages: List[Message] = Field(..., description="The message history including the user prompt")
