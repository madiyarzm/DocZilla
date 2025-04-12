import { ChatMessage } from "@/types/chat"

const API_BASE_URL = "http://127.0.0.1:8000"

export async function sendChatMessage(messages: ChatMessage[]): Promise<ChatMessage[]> {
  try {
    // Convert messages to the format expected by the backend
    const formattedMessages = messages.map(msg => ({
      ...msg,
      timestamp: msg.timestamp.toISOString() // Convert Date to ISO string for backend
    }))

    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages: formattedMessages }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    // Convert timestamp strings to Date objects and ensure unique IDs
    return data.messages.map((message: any, index: number) => ({
      ...message,
      id: `${Date.now()}-${index}`, // Ensure unique IDs
      timestamp: new Date(message.timestamp || Date.now())
    }))
  } catch (error) {
    console.error("Error sending chat message:", error)
    throw error
  }
} 