import { apiUrl, directUrl } from "@/lib/api"

export interface ClauseResult {
  clause_id: string
  requirement: string
  severity: string
  status: "PASS" | "FAIL" | "AMBIGUOUS"
  evidence: string
  suggestion: string
}

export interface AuditEntry {
  timestamp: string
  clause_id: string
  decision: string
  evidence: string
  iteration: number
}

export interface ComplianceReport {
  checklist: Array<{ clause_id: string; requirement: string; severity: string }>
  iterations: Array<{
    iteration: number
    compliance_score: number
    counts: Record<string, number>
    total: number
    results: ClauseResult[]
  }>
  final_results: ClauseResult[]
  final_contract: string
  audit_trail: AuditEntry[]
  compliance_score: number
  counts: Record<string, number>
  total: number
  all_pass: boolean
  policy_filename: string
  contract_filename: string
}

export async function runComplianceCheck(
  policyFile: File,
  contractFile: File,
  maxIterations = 3,
): Promise<ComplianceReport> {
  const fd = new FormData()
  fd.append("policy_file", policyFile)
  fd.append("contract_file", contractFile)
  fd.append("max_iterations", String(maxIterations))

  // Direct to backend: the agentic loop runs >30s and the Next proxy times out.
  const res = await fetch(directUrl("/api/compliance/check"), { method: "POST", body: fd })
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const err = data && typeof data === "object" ? data : { detail: "Request failed" }
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  if (!data || !Array.isArray(data.final_results)) {
    const keys = data && typeof data === "object" ? Object.keys(data).join(", ") : "none"
    throw new Error(
      `Wrong API response (expected DocZilla compliance report, got keys: ${keys}). ` +
        "Restart backend on port 8001 and frontend on 3001, then hard-refresh the page.",
    )
  }
  return data
}

export interface LicenseRow {
  dependency: string
  version: string
  license: string
  compatible: boolean
  reason: string
  spdx_clause: string
}

export interface LicenseReport {
  ecosystem: string
  project_license: string
  dependency_count: number
  conflict_count: number
  results: LicenseRow[]
}

export async function runLicenseCheck(
  file: File,
  projectLicense: string,
): Promise<LicenseReport> {
  const fd = new FormData()
  fd.append("file", file)
  fd.append("project_license", projectLicense)

  // Direct to backend: many registry lookups can exceed the proxy timeout.
  const res = await fetch(directUrl("/api/compliance/license"), { method: "POST", body: fd })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  return res.json()
}

export interface TrendingItem {
  question: string
  count: number
}

export async function getTrending(): Promise<TrendingItem[]> {
  const res = await fetch(apiUrl("/api/trending"), { method: "GET" })
  if (!res.ok) return []
  const data = await res.json()
  return data.trending || []
}
