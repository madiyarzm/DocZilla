<div align="center">

# 🦖 DocZilla

### The agent that reads the fine print.

**An agentic compliance platform** — upload your policy and a contract, and DocZilla audits
every clause against it, flags what fails, drafts the rewrite, and re-checks until it passes.
Every answer cites its exact source.

[**Live demo →**](https://doczilla-five.vercel.app) &nbsp;·&nbsp; Built with FastAPI · Next.js · Upstage Solar

</div>

---

## Why this exists

Compliance review is slow, manual, and easy to get wrong — someone reads a contract line by
line against an internal policy and hopes they didn't miss anything. DocZilla turns that into a
verifiable, **agentic loop**: it extracts a testable checklist from the policy, checks the
contract clause by clause, and — crucially — doesn't stop at finding problems. It proposes a
fix, applies it, and runs the audit again, iterating until everything passes or you stop it.
The result is a compliance score, a per-clause verdict with cited evidence, suggested rewrites,
and a full timestamped audit trail.

> Originally a hackathon project (“The Nomads”), rebuilt from the ground up: reasoning moved to a
> single LLM provider, a real agentic loop, mandatory source citations, a dependency-license
> checker, and a complete UI/UX redesign.

## What it does

| Feature | What's interesting about it |
|---|---|
| **🔁 Agentic compliance loop** | Policy → checklist → clause-level verdicts (Pass / Fail / Ambiguous) → suggested rewrites → re-check, iterating to convergence. Returns a score, per-clause evidence, and an audit trail. |
| **📎 Source citations** | Every chat answer carries `{filename, section, clause, page, exact snippet}`. If retrieval finds nothing, it says *“I couldn't find a source”* instead of hallucinating. |
| **⚖️ License compliance** | Point it at a `package.json` or `requirements.txt`; it resolves each dependency's license from npm / PyPI (incl. PEP 639 `license_expression`) and flags SPDX conflicts with your project license. |
| **📈 Trending questions** | In-memory frequency tracking with semantic de-duplication (questions that mean the same thing merge). |

## How it works

```
                         ┌──────────────────────────────────────────────┐
  policy.pdf ─┐          │  AGENTIC COMPLIANCE LOOP                      │
              ├─ ingest ─►  1. extract testable checklist (severity)    │
 contract.pdf ┘  (parse,  │  2. check each clause → PASS / FAIL / AMBIG  │
                  OCR,    │  3. draft rewrites for failures              │
                  chunk)  │  4. apply + re-check ──┐ until all pass or   │
                         │     ▲──────────────────┘ max iterations       │
                         └──────────────────────────────────────────────┘
                                          │
                          score · per-clause evidence · audit trail
```

**Retrieval-augmented chat** runs over the same ingested documents: query → local embeddings →
cosine search over a metadata-rich vector store → answer grounded in retrieved clauses, with
citations attached.

## Tech stack & decisions

- **Backend — FastAPI (Python).** Thin routes over a small set of focused utilities (ingest,
  chunk, embeddings, vector store, the compliance engine, license resolver).
- **Reasoning — Upstage Solar (`solar-pro3`)** via the OpenAI-compatible SDK. One provider key
  powers both parsing/OCR and all LLM reasoning.
- **Document parsing/OCR — Upstage Document Digitization.** Structured elements carry page and
  section, so chunks preserve `{filename, page, section, clause_id}` — which is what makes
  citations exact.
- **Embeddings — local & free.** `sentence-transformers` when available, with an automatic
  **deterministic-hashing fallback** so the app runs anywhere with zero heavy dependencies.
- **Vector store — in-process numpy cosine** over normalized vectors (FAISS's role, zero install
  risk), persisted to disk.
- **Frontend — Next.js 15 + Tailwind + framer-motion.** A unified workspace (Overview,
  Compliance, Licenses, Assistant) plus a marketing landing whose hero is the *live clause-audit
  ledger* — the product, animating.
- **No Redis** — caches are in-memory by design for a self-contained demo.

```
backend/
  routes/      upload · chat · query · compliance · trending · slack · policy
  utils/
    ingest.py        file-type dispatch (PDF/PNG/JPG/DOCX/TXT/package.json/requirements.txt)
    upstage.py       Document Parse + OCR
    chunk.py         metadata-rich chunking (section / clause)
    embeddings.py    sentence-transformers + hashing fallback
    vector_store.py  numpy cosine store
    llm_client.py    Upstage Solar wrapper (complete / JSON / stream)
    compliance.py    the agentic loop
    licenses.py      npm / PyPI resolution + SPDX compatibility
    citations.py     citation builder
frontend/
  app/page.tsx           landing (animated clause-ledger hero)
  app/app/               unified workspace: overview · compliance · licenses · assistant
  components/clause-ledger.tsx   the signature component, reused live in both
```

## Run it locally

**Backend**
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt          # add -r requirements-ml.txt for ML embeddings
cp .env.example .env                      # set UPSTAGE_API_KEY
uvicorn main:app --reload --port 8001     # http://localhost:8001/docs
```

**Frontend**
```bash
cd frontend
npm install --legacy-peer-deps
cp .env.local.example .env.local
npm run dev                               # http://localhost:3001
```

Open **`/`** for the landing and **`/app`** for the workspace. Sample policy / contract /
manifest files live in [`samples/`](samples/).

## Deploy

This project is **live in production**:

- **Frontend** → Vercel: <https://doczilla-five.vercel.app>
- **Backend** → Railway: <https://doczilla-api-production.up.railway.app> (`/health`, `/docs`)

To deploy your own:

- **Frontend → Vercel.** Import the repo, set **Root Directory = `frontend`**, and set
  `NEXT_PUBLIC_API_URL` to your backend's public URL.
- **Backend → Railway / Render / Fly.** Root `backend/`, start command
  `uvicorn main:app --host 0.0.0.0 --port $PORT` (a `Procfile` is included). Set `UPSTAGE_API_KEY`
  and `CORS_ORIGINS=https://<your-vercel-domain>`.

The landing page is fully static and looks great on its own; the interactive features light up
once the backend URL is wired in.

## Env vars

| Service | Variable | Notes |
|---|---|---|
| Backend | `UPSTAGE_API_KEY` | Parsing/OCR **and** reasoning. $10 free credits at console.upstage.ai |
| Backend | `CORS_ORIGINS` | Comma-separated; add your deployed frontend origin |
| Backend | `UPSTAGE_MODEL` | optional, default `solar-pro3` |
| Frontend | `NEXT_PUBLIC_API_URL` | Backend base URL (prod) |

## Notes & limitations

- Trending FAQs and the vector store are in-memory / single-process — perfect for a demo, swap
  for Redis + a managed vector DB for production.
- The agentic loop makes several sequential LLM calls, so an audit takes ~30–60s.

## License

MIT.
