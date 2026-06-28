"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Loader2, Play, ChevronRight, FileText } from "lucide-react"
import { PageHeader } from "@/components/app/app-shell"
import { ClauseLedger } from "@/components/clause-ledger"
import { runComplianceCheck, type ComplianceReport } from "@/services/compliance"

export default function CompliancePage() {
  const [policy, setPolicy] = useState<File | null>(null)
  const [contract, setContract] = useState<File | null>(null)
  const [iterations, setIterations] = useState(3)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<ComplianceReport | null>(null)
  const [showAudit, setShowAudit] = useState(false)

  async function run() {
    if (!policy || !contract) return
    setLoading(true); setError(null); setReport(null)
    try {
      setReport(await runComplianceCheck(policy, contract, iterations))
    } catch (e: any) {
      setError(e?.message || "Couldn't reach the compliance service.")
    } finally {
      setLoading(false)
    }
  }

  const ok = report && Array.isArray(report.final_results)

  return (
    <>
      <PageHeader
        title="Compliance"
        description="Audit a contract against a policy. The agent checks every clause, suggests fixes, and re-checks until it passes."
      />
      <div className="space-y-6 px-6 py-6 lg:px-10">
        {/* Inputs */}
        <div className="grid gap-4 rounded-2xl border border-border bg-card p-5 lg:grid-cols-[1fr_1fr_auto]">
          <FileField label="Policy" hint="the ground truth" file={policy} onChange={setPolicy} />
          <FileField label="Contract" hint="document to check" file={contract} onChange={setContract} />
          <div className="flex items-end gap-3">
            <label className="text-sm">
              <span className="mb-1.5 block text-muted-foreground">Iterations</span>
              <input
                type="number" min={1} max={6} value={iterations}
                onChange={(e) => setIterations(Number(e.target.value))}
                className="w-20 rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </label>
            <button
              onClick={run}
              disabled={!policy || !contract || loading}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {loading ? "Auditing…" : "Run audit"}
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/50 px-4 py-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Extracting the checklist, checking each clause, applying rewrites… this runs the full agent loop and can take a minute.
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {report && !ok && (
          <RawPayload report={report} />
        )}

        {ok && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <ScoreBar report={report!} />
            <div>
              <h2 className="mb-3 font-display text-lg font-semibold">Clauses</h2>
              <ClauseLedger items={report!.final_results as any} />
            </div>
            <div className="rounded-2xl border border-border bg-card">
              <button
                onClick={() => setShowAudit((s) => !s)}
                className="flex w-full items-center gap-2 px-5 py-4 text-left text-sm font-medium"
              >
                <ChevronRight className={`h-4 w-4 transition-transform ${showAudit ? "rotate-90" : ""}`} />
                Audit trail · {report!.audit_trail?.length ?? 0} decisions
              </button>
              {showAudit && (
                <div className="max-h-80 space-y-1 overflow-auto border-t border-border px-5 py-4 font-mono text-xs">
                  {(report!.audit_trail ?? []).map((a, i) => (
                    <div key={i} className="border-b border-border/60 py-1">
                      <span className="text-muted-foreground">[iter {a.iteration}] {a.clause_id}</span>{" "}
                      → <span className="font-semibold">{a.decision}</span>
                      {a.evidence && <span className="text-muted-foreground"> — {a.evidence}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </>
  )
}

function ScoreBar({ report }: { report: ComplianceReport }) {
  const score = report.compliance_score ?? 0
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="font-display text-4xl font-semibold tabular-nums">
            {score}%
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {report.counts?.PASS ?? 0} pass · {report.counts?.FAIL ?? 0} fail ·{" "}
            {report.counts?.AMBIGUOUS ?? 0} ambiguous · {report.iterations?.length ?? 0} iteration(s)
          </p>
        </div>
        <span
          className="rounded-full px-3 py-1 text-sm font-medium"
          style={
            report.all_pass
              ? { color: "var(--dz-pass)", backgroundColor: "color-mix(in srgb, var(--dz-pass) 12%, transparent)" }
              : { color: "var(--dz-fail)", backgroundColor: "color-mix(in srgb, var(--dz-fail) 12%, transparent)" }
          }
        >
          {report.all_pass ? "All clauses compliant" : "Issues remain"}
        </span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: report.all_pass ? "var(--dz-pass)" : "hsl(var(--primary))" }}
        />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {(report.iterations ?? []).map((it) => (
          <span key={it.iteration} className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
            Iter {it.iteration}: {it.compliance_score}%
          </span>
        ))}
      </div>
    </div>
  )
}

function RawPayload({ report }: { report: any }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="font-display text-base font-semibold">Unexpected response</h2>
      <p className="mt-1 text-sm text-muted-foreground">The server replied, but not with a report:</p>
      <pre className="mt-3 max-h-80 overflow-auto rounded-lg bg-secondary/60 p-3 text-xs">
        {JSON.stringify(report, null, 2)}
      </pre>
    </div>
  )
}

function FileField({
  label, hint, file, onChange,
}: { label: string; hint: string; file: File | null; onChange: (f: File | null) => void }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline gap-2 text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">{hint}</span>
      </span>
      <div className="flex items-center gap-3 rounded-lg border border-dashed border-border bg-background px-3 py-2.5">
        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
          {file ? file.name : "Choose a PDF, DOCX, or TXT"}
        </span>
        <label className="cursor-pointer rounded-md bg-secondary px-2.5 py-1 text-xs font-medium hover:bg-secondary/70">
          Browse
          <input
            type="file"
            className="hidden"
            accept=".pdf,.docx,.txt"
            onChange={(e) => onChange(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>
    </label>
  )
}
