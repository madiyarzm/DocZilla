"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Loader2, Scale, FileText, Check, X } from "lucide-react"
import { PageHeader } from "@/components/app/app-shell"
import { runLicenseCheck, type LicenseReport } from "@/services/compliance"

const LICENSES = ["MIT", "Apache-2.0", "BSD-3-Clause", "GPL-3.0", "AGPL-3.0", "LGPL-3.0", "MPL-2.0", "Proprietary"]

export default function LicensesPage() {
  const [file, setFile] = useState<File | null>(null)
  const [projectLicense, setProjectLicense] = useState("MIT")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<LicenseReport | null>(null)

  async function run() {
    if (!file) return
    setLoading(true); setError(null); setReport(null)
    try {
      setReport(await runLicenseCheck(file, projectLicense))
    } catch (e: any) {
      setError(e?.message || "Couldn't reach the license service.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Licenses"
        description="Resolve every dependency's license from npm or PyPI and flag conflicts with your project license."
      />
      <div className="space-y-6 px-6 py-6 lg:px-10">
        <div className="grid gap-4 rounded-2xl border border-border bg-card p-5 lg:grid-cols-[1fr_auto_auto]">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Manifest</span>
            <div className="flex items-center gap-3 rounded-lg border border-dashed border-border bg-background px-3 py-2.5">
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                {file ? file.name : "package.json or requirements.txt"}
              </span>
              <label className="cursor-pointer rounded-md bg-secondary px-2.5 py-1 text-xs font-medium hover:bg-secondary/70">
                Browse
                <input type="file" className="hidden" accept=".json,.txt"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              </label>
            </div>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Project license</span>
            <select
              value={projectLicense}
              onChange={(e) => setProjectLicense(e.target.value)}
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
            >
              {LICENSES.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </label>
          <div className="flex items-end">
            <button
              onClick={run}
              disabled={!file || loading}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Scale className="h-4 w-4" />}
              Check
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
        )}

        {report && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
              <div className="text-sm">
                <span className="font-medium">{report.dependency_count}</span> dependencies ·{" "}
                <span className="text-muted-foreground">{report.ecosystem} · vs {report.project_license}</span>
              </div>
              <span
                className="rounded-full px-3 py-1 text-sm font-medium"
                style={report.conflict_count > 0
                  ? { color: "var(--dz-fail)", backgroundColor: "color-mix(in srgb, var(--dz-fail) 12%, transparent)" }
                  : { color: "var(--dz-pass)", backgroundColor: "color-mix(in srgb, var(--dz-pass) 12%, transparent)" }}
              >
                {report.conflict_count > 0 ? `${report.conflict_count} conflict(s)` : "No conflicts"}
              </span>
            </div>
            <div className="divide-y divide-border">
              {report.results.map((r) => (
                <div key={r.dependency} className="grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-3 sm:grid-cols-[1.2fr_0.8fr_0.6fr_auto]">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{r.dependency}</div>
                    <div className="font-mono text-xs text-muted-foreground">{r.version}</div>
                  </div>
                  <div className="hidden text-sm sm:block">{r.license}</div>
                  <div className="hidden sm:block">
                    {r.compatible ? (
                      <span className="inline-flex items-center gap-1 text-xs" style={{ color: "var(--dz-pass)" }}><Check className="h-3 w-3" /> OK</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs" style={{ color: "var(--dz-fail)" }}><X className="h-3 w-3" /> Conflict</span>
                    )}
                  </div>
                  <div className="max-w-[18rem] justify-self-end text-right text-xs text-muted-foreground">{r.reason}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </>
  )
}
