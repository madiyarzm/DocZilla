import { apiUrl } from "@/lib/api"

export interface UploadResponse {
  message: string
  filename: string
  chunks: number
  embedding_backend: string
  sample_metadata?: Array<Record<string, unknown>>
}

export async function uploadDocument(file: File): Promise<UploadResponse> {
  const formData = new FormData()
  formData.append("file", file)

  const response = await fetch(apiUrl("/upload"), {
    method: "POST",
    body: formData,
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: "Upload failed" }))
    throw new Error(err.detail || `HTTP error! status: ${response.status}`)
  }
  return response.json()
}
