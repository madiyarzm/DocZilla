"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, X, AlertTriangle, Loader2 } from "lucide-react"

export type Verdict = "PASS" | "FAIL" | "AMBIGUOUS" | "CHECKING"

const VERDICT = {
  PASS: { label: "Pass", icon: Check, color: "var(--dz-pass)" },
  FAIL: { label: "Fail", icon: X, color: "var(--dz-fail)" },
  AMBIGUOUS: { label: "Ambiguous", icon: AlertTriangle, color: "var(--dz-amb)" },
  CHECKING: { label: "Checking", icon: Loader2, color: "hsl(var(--muted-foreground))" },
} as const

const SEV = { high: 3, medium: 2, low: 1 } as const

export interface LedgerItem {
  clause_id: string
  requirement: string
  severity: string
  status: Verdict
  evidence?: string
  suggestion?: string
}

function VerdictChip({ status }: { status: Verdict }) {
  const v = VERDICT[status]
  const Icon = v.icon
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{
        color: v.color,
        backgroundColor: `color-mix(in srgb, ${v.color} 12%, transparent)`,
      }}
    >
      <Icon className={`h-3 w-3 ${status === "CHECKING" ? "animate-spin" : ""}`} />
      {v.label}
    </span>
  )
}

function SeverityBars({ severity }: { severity: string }) {
  const n = SEV[severity as keyof typeof SEV] ?? 2
  return (
    <span className="flex items-end gap-0.5" title={`${severity} severity`}>
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className="w-1 rounded-sm"
          style={{
            height: `${4 + i * 3}px`,
            backgroundColor:
              i <= n ? "hsl(var(--primary))" : "hsl(var(--border))",
          }}
        />
      ))}
    </span>
  )
}

export function ClauseRow({
  item,
  index,
  defaultOpen = false,
}: {
  item: LedgerItem
  index: number
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const hasDetail = Boolean(item.evidence || item.suggestion)
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="border-b border-border last:border-0"
    >
      <button
        onClick={() => hasDetail && setOpen((o) => !o)}
        className="flex w-full items-center gap-3 py-3 text-left"
      >
        <span className="font-mono text-xs text-muted-foreground w-8 shrink-0">
          {item.clause_id}
        </span>
        <SeverityBars severity={item.severity} />
        <span className="flex-1 text-sm leading-snug">{item.requirement}</span>
        <VerdictChip status={item.status} />
      </button>
      <AnimatePresence initial={false}>
        {open && hasDetail && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pb-4 pl-11 pr-2 space-y-2">
              {item.evidence && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Evidence — </span>
                  {item.evidence}
                </p>
              )}
              {item.suggestion && item.status !== "PASS" && (
                <p className="rounded-lg border border-border bg-secondary/60 p-2.5 text-xs">
                  <span className="font-medium">Suggested rewrite — </span>
                  {item.suggestion}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function ClauseLedger({ items }: { items: LedgerItem[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-2 sm:p-4">
      {items.map((item, i) => (
        <ClauseRow key={item.clause_id} item={item} index={i} />
      ))}
    </div>
  )
}

/* --- Auto-playing hero demo (no backend) --- */

const DEMO: LedgerItem[] = [
  { clause_id: "C1", severity: "high", status: "CHECKING", requirement: "Customer data retained 7 years, encrypted at rest", evidence: "Contract specifies 3 years — below the 7-year minimum.", suggestion: "Retain all customer data for at least seven (7) years, encrypted with AES-256." },
  { clause_id: "C3", severity: "medium", status: "CHECKING", requirement: "Termination requires 30 days written notice", evidence: "§2: “…thirty (30) days prior written notice.”" },
  { clause_id: "C4", severity: "high", status: "CHECKING", requirement: "Confidentiality survives termination ≥ 3 years", evidence: "§3: survives for three (3) years." },
  { clause_id: "C5", severity: "high", status: "CHECKING", requirement: "Liability capped at total fees paid", evidence: "No limitation-of-liability clause present.", suggestion: "Add: each party's aggregate liability is capped at total fees paid under this Agreement." },
  { clause_id: "C7", severity: "high", status: "CHECKING", requirement: "Prior approval before engaging subprocessors", evidence: "§5 allows subprocessors with no approval requirement.", suggestion: "Require prior written approval before engaging any subprocessor handling customer data." },
]

const RESOLVED: Verdict[] = ["FAIL", "PASS", "PASS", "FAIL", "FAIL"]

export function ClauseLedgerDemo() {
  const [items, setItems] = useState<LedgerItem[]>(DEMO)
  const [score, setScore] = useState(0)
  const [phase, setPhase] = useState<"checking" | "resolved" | "fixed">("checking")

  useEffect(() => {
    let timers: ReturnType<typeof setTimeout>[] = []
    const run = () => {
      setItems(DEMO.map((d) => ({ ...d, status: "CHECKING" })))
      setScore(0)
      setPhase("checking")
      // resolve each clause in sequence
      RESOLVED.forEach((verdict, i) => {
        timers.push(
          setTimeout(() => {
            setItems((prev) =>
              prev.map((it, idx) => (idx === i ? { ...it, status: verdict } : it)),
            )
          }, 700 + i * 600),
        )
      })
      // score in
      timers.push(setTimeout(() => { setScore(40); setPhase("resolved") }, 700 + RESOLVED.length * 600 + 300))
      // apply fixes → all pass
      timers.push(
        setTimeout(() => {
          setItems((prev) => prev.map((it) => ({ ...it, status: "PASS" as Verdict })))
          setScore(100)
          setPhase("fixed")
        }, 700 + RESOLVED.length * 600 + 1900),
      )
      // loop
      timers.push(setTimeout(run, 700 + RESOLVED.length * 600 + 5200))
    }
    run()
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div className="rounded-2xl border border-border bg-card/80 backdrop-blur p-4 sm:p-5 dz-glow">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            audit · vendor_msa.pdf
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">score</span>
          <motion.span
            key={score}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-lg font-semibold tabular-nums"
            style={{ color: phase === "fixed" ? "var(--dz-pass)" : undefined }}
          >
            {score}%
          </motion.span>
        </div>
      </div>
      <div className="px-1">
        {items.map((item, i) => (
          <ClauseRow key={item.clause_id} item={item} index={i} defaultOpen={false} />
        ))}
      </div>
      <AnimatePresence>
        {phase === "resolved" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-3 flex items-center gap-2 rounded-lg bg-secondary/70 px-3 py-2 text-xs text-muted-foreground"
          >
            <Loader2 className="h-3 w-3 animate-spin" />
            Applying 3 suggested rewrites, re-checking…
          </motion.div>
        )}
        {phase === "fixed" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs"
            style={{ backgroundColor: "color-mix(in srgb, var(--dz-pass) 12%, transparent)", color: "var(--dz-pass)" }}
          >
            <Check className="h-3 w-3" />
            All clauses compliant after 2 iterations.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
