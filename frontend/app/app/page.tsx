"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ScrollText, Scale, MessageSquareQuote, TrendingUp, ArrowRight, RefreshCw } from "lucide-react"
import { PageHeader } from "@/components/app/app-shell"
import { getTrending, type TrendingItem } from "@/services/compliance"

const ENTRIES = [
  { href: "/app/compliance", icon: ScrollText, title: "Run a compliance audit", body: "Check a contract against your policy, clause by clause." },
  { href: "/app/licenses", icon: Scale, title: "Check dependency licenses", body: "Flag SPDX conflicts in a package.json or requirements.txt." },
  { href: "/app/assistant", icon: MessageSquareQuote, title: "Ask with citations", body: "Grounded answers over your uploaded documents." },
]

export default function Overview() {
  return (
    <>
      <PageHeader title="Overview" description="Everything DocZilla can do, in one place." />
      <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1fr_320px] lg:px-10">
        <div className="space-y-4">
          {ENTRIES.map((e, i) => {
            const Icon = e.icon
            return (
              <motion.div key={e.href} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <Link
                  href={e.href}
                  className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition hover:border-primary/50"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display font-semibold">{e.title}</h3>
                    <p className="text-sm text-muted-foreground">{e.body}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                </Link>
              </motion.div>
            )
          })}
        </div>
        <TrendingPanel />
      </div>
    </>
  )
}

function TrendingPanel() {
  const [items, setItems] = useState<TrendingItem[]>([])
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    try { setItems(await getTrending()) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  return (
    <aside className="rounded-2xl border border-border bg-card p-5 h-fit">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-display font-semibold">
          <TrendingUp className="h-4 w-4 text-primary" /> Trending
        </h3>
        <button onClick={load} className="text-muted-foreground transition hover:text-foreground" title="Refresh">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          No questions yet this session. Ask the assistant something to populate this.
        </p>
      ) : (
        <ol className="mt-4 space-y-2.5">
          {items.map((it, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="font-mono text-xs text-muted-foreground">{i + 1}</span>
              <span className="flex-1">{it.question}</span>
              <span className="rounded-full bg-secondary px-1.5 text-xs text-muted-foreground">{it.count}</span>
            </li>
          ))}
        </ol>
      )}
      <p className="mt-4 text-[11px] text-muted-foreground">In-memory · resets on restart.</p>
    </aside>
  )
}
