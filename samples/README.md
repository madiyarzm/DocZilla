# Sample test files

Use these on the **/demo** page (http://localhost:3000/demo) or via the API.

| File | Use in | What it shows |
|------|--------|---------------|
| `policy.txt` | Agentic Compliance → "Policy document" | Ground-truth policy (7-year retention, encryption, 30-day termination, liability cap, GDPR deletion, subprocessor approval, governing law). |
| `contract.txt` | Agentic Compliance → "Contract / document" | A contract that **passes some and fails others** (only 3-year retention, no encryption, no liability cap, no GDPR deletion, subprocessors without approval) so the agentic loop suggests rewrites and iterates. |
| `requirements.txt` | License Compliance | Against project license **MIT**: 1 conflict — `mysqlclient` (GPL-2.0). `paramiko` is LGPL (weak copyleft, allowed); the rest are permissive. |
| `package.json` | License Compliance | Against **MIT**: all dependencies permissive → **no conflicts**. |

## Notes
- **Agentic Compliance, cited chat, and Slack summaries require Upstage credits**
  (they call Solar). The **License Compliance** flow works without credits.
- For the cited-chat tab, first upload a document (e.g. `policy.txt`) via the
  chat dashboard, then ask things like *"How long must data be retained?"*

## Quick API tests (no frontend)

```bash
# License check (no credits needed)
curl -F "file=@samples/requirements.txt" -F "project_license=MIT" \
  http://localhost:8000/api/compliance/license

# Agentic compliance loop (needs Upstage credits)
curl -F "policy_file=@samples/policy.txt" -F "contract_file=@samples/contract.txt" \
  -F "max_iterations=3" http://localhost:8000/api/compliance/check
```
