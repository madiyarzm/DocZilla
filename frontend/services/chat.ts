import { ChatMessage } from "@/types/chat"
import { apiUrl } from "@/lib/api"

export interface Citation {
  filename: string
  page: number
  section: string
  clause_id: number | null
  exact_text_snippet: string
  score: number
}

interface ChatPayload {
  messages: ChatMessage[]
  documentId?: string
  documentContent?: string
}

export interface ChatResult {
  messages: ChatMessage[]
  citations: Citation[]
}

export async function sendChatMessage(payload: ChatPayload): Promise<ChatResult> {
  const response = await fetch(apiUrl("/chat"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

  const data = await response.json()
  const messages = data.messages.map((message: any, index: number) => ({
    ...message,
    id: `${Date.now()}-${index}`,
    timestamp: new Date(message.timestamp || Date.now()),
  }))
  return { messages, citations: data.citations || [] }
}
