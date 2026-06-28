// In dev the browser uses same-origin URLs (e.g. /chat) which Next.js proxies
// to the DocZilla backend (see next.config.mjs). Set NEXT_PUBLIC_API_URL only
// for production or when the frontend talks to a remote API directly.
const configured = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "")

export const API_BASE =
  configured && configured.length > 0
    ? configured
    : typeof window !== "undefined"
      ? ""
      : process.env.BACKEND_URL?.replace(/\/$/, "") || "http://127.0.0.1:8001"

export function apiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`
  return API_BASE ? `${API_BASE}${p}` : p
}

// Direct-to-backend URL, bypassing the Next.js dev proxy. The proxy aborts
// upstream requests that take ~30s+ (undici timeout), which breaks the agentic
// compliance loop. Long endpoints call the backend origin directly instead
// (CORS allows it). Falls back to the conventional local backend port.
const BACKEND_DIRECT =
  configured && configured.length > 0 ? configured : "http://127.0.0.1:8001"

export function directUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`
  return `${BACKEND_DIRECT}${p}`
}
