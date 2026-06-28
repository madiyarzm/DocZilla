"use client"

import { useRef, useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Loader2, Paperclip, Bot, User, FileText, Check } from "lucide-react"
import { PageHeader } from "@/components/app/app-shell"
import { sendChatMessage, type Citation } from "@/services/chat"
import { uploadDocument } from "@/services/upload"

interface Msg { id: string; role: "user" | "assistant" | "system"; content: string }

export default function AssistantPage() {
  const [messages, setMessages] = useState<Msg[]>([
    { id: "0", role: "assistant", content: "Upload a document, then ask me anything about it. Every answer cites the exact clause it came from." },
  ])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [citations, setCitations] = useState<Citation[]>([])
  const endRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  async function send() {
    const text = input.trim()
    if (!text || sending) return
    const userMsg: Msg = { id: `${Date.now()}`, role: "user", content: text }
    setMessages((m) => [...m, userMsg])
    setInput("")
    setSending(true)
    setCitations([])
    try {
      const res = await sendChatMessage({ messages: [...messages, userMsg] as any })
      setMessages(res.messages.map((m: any, i: number) => ({ id: `r${i}`, role: m.role, content: m.content })))
      setCitations(res.citations)
    } catch {
      setMessages((m) => [...m, { id: `e${Date.now()}`, role: "assistant", content: "Something went wrong reaching the assistant. Try again." }])
    } finally {
      setSending(false)
    }
  }

  async function onUpload(file: File) {
    setUploading(true)
    try {
      const res = await uploadDocument(file)
      setMessages((m) => [...m, { id: `u${Date.now()}`, role: "system", content: `Indexed ${res.filename} — ${res.chunks} chunks.` }])
    } catch (e: any) {
      setMessages((m) => [...m, { id: `ue${Date.now()}`, role: "system", content: e?.message || "Upload failed." }])
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <PageHeader title="Assistant" description="Grounded answers over your uploaded documents — with citations, or an honest 'no source found'." />
      <div className="grid lg:grid-cols-[1fr_320px]">
        {/* conversation */}
        <div className="flex h-[calc(100vh-97px)] flex-col">
          <div className="flex-1 space-y-5 overflow-auto px-6 py-6 lg:px-10">
            {messages.map((m) => (
              <Bubble key={m.id} msg={m} />
            ))}
            {sending && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> thinking…
              </div>
            )}
            <div ref={endRef} />
          </div>
          <div className="border-t border-border px-6 py-4 lg:px-10">
            <div className="flex items-end gap-2">
              <button
                onClick={() => fileRef.current?.click()}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border transition hover:bg-secondary"
                title="Upload a document"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
              </button>
              <input ref={fileRef} type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.txt,.docx"
                onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() } }}
                rows={1}
                placeholder="Ask about your documents…"
                className="max-h-32 flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
              <button
                onClick={send}
                disabled={!input.trim() || sending}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* citations rail */}
        <aside className="hidden border-l border-border lg:block">
          <div className="sticky top-0 px-5 py-6">
            <h3 className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Sources</h3>
            <AnimatePresence mode="popLayout">
              {citations.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  Citations for the latest answer appear here.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {citations.map((c, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="rounded-xl border border-border bg-card p-3"
                    >
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                        <span className="rounded bg-secondary px-1.5 py-0.5 font-mono">{c.filename}</span>
                        <span>·</span><span>{c.section}</span>
                        <span>·</span><span>clause {c.clause_id}</span>
                        <span>·</span><span>p{c.page}</span>
                      </div>
                      <p className="mt-2 text-xs italic text-muted-foreground">“{c.exact_text_snippet}”</p>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>
        </aside>
      </div>
    </>
  )
}

function Bubble({ msg }: { msg: Msg }) {
  if (msg.role === "system") {
    return (
      <div className="flex justify-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
          <Check className="h-3 w-3" /> {msg.content}
        </span>
      </div>
    )
  }
  const isUser = msg.role === "user"
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 ${isUser ? "justify-end" : ""}`}>
      {!isUser && (
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Bot className="h-4 w-4" />
        </span>
      )}
      <div className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
        isUser ? "bg-primary text-primary-foreground" : "border border-border bg-card"
      }`}>
        {msg.content}
      </div>
      {isUser && (
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-secondary">
          <User className="h-4 w-4" />
        </span>
      )}
    </motion.div>
  )
}
