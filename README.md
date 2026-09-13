# Structura AI

**Understand. Diagnose. Restructure.**

Structura AI is a document intelligence workspace. It accepts PDF, DOCX, PPTX, XLSX, CSV, TXT, Markdown, and image uploads, extracts their available text and structure, classifies the document, compares its structure against versioned requirements, detects missing and misordered sections, and returns an actionable restructuring plan. Image-only files currently fail explicitly until an OCR provider is configured.

## Monorepo

```text
apps/
  api/                 FastAPI document intelligence service
  web/                 Next.js App Router interface
packages/
  types/               Shared report contracts
supabase/
  migrations/          PostgreSQL + pgvector schema and RLS
```

## Quick start

### API

```powershell
cd apps\api
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload --port 8000
```

### Web

```powershell
cd apps\web
npm install
Copy-Item .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. The UI uses `NEXT_PUBLIC_API_URL` to call the API.

## Model providers

The API has a typed `ModelProvider` boundary for OpenAI-compatible gateways, including OmniRoute. Set `MODEL_PROVIDER=openai_compatible`, `MODEL_BASE_URL`, `MODEL_API_KEY`, and `MODEL_NAME` to enable model-backed enrichment. Without those values, deterministic extraction and rule analysis remain available; no fabricated AI response is returned.

## Supabase

Apply `supabase/migrations/0001_structura.sql` to a Supabase project. The schema includes storage metadata, normalized document entities, agent runs, feedback, vector embeddings, indexes, and RLS policies. The local API currently stores an in-memory job for a fast development loop; the service boundaries are ready to swap to Supabase repositories.

## API

- `POST /api/v1/documents/analyze` — upload a supported document and run analysis synchronously
- `POST /api/v1/documents/analyze/async` — queue analysis and receive a job ID
- `GET /api/v1/jobs/{job_id}` — poll asynchronous analysis status
- `GET /api/v1/documents/{document_id}` — retrieve the latest report
- `GET /health` — service health

The upload endpoint validates extension, MIME, size, and PDF magic bytes. Uploaded text is treated as untrusted content and is passed to agents as evidence only.
