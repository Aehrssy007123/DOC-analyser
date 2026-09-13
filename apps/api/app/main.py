from fastapi import BackgroundTasks, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .pipeline import analyze_document as run_analysis
from .schemas import Report

app = FastAPI(title="Structura AI API", version="0.1.0")
_origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(CORSMiddleware, allow_origins=_origins or ["*"], allow_methods=["*"], allow_headers=["*"])
reports: dict[str, Report] = {}
jobs: dict[str, dict] = {}
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".pptx", ".xlsx", ".csv", ".txt", ".md", ".png", ".jpg", ".jpeg", ".webp"}
ALLOWED_MIME_PREFIXES = ("application/", "text/", "image/")


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/v1/documents/analyze", response_model=Report)
async def analyze_document(file: UploadFile = File(...)) -> Report:
    if not file.filename or "." not in file.filename:
        raise HTTPException(415, "The upload must have a supported file extension.")
    extension = "." + file.filename.rsplit(".", 1)[1].lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(415, "Supported formats: PDF, DOCX, PPTX, XLSX, CSV, TXT, Markdown, PNG, JPG, and WEBP.")
    if file.content_type and not file.content_type.startswith(ALLOWED_MIME_PREFIXES):
        raise HTTPException(415, "The uploaded file MIME type is not supported.")
    content = await file.read()
    if len(content) > settings.max_upload_mb * 1024 * 1024:
        raise HTTPException(413, f"File exceeds the {settings.max_upload_mb} MB limit.")
    if extension == ".pdf" and not content.startswith(b"%PDF"):
        raise HTTPException(400, "The file failed PDF signature validation.")
    try:
        report = run_analysis(file.filename, content)
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc
    except Exception as exc:
        raise HTTPException(500, "Document processing failed before a report could be produced.") from exc
    reports[report.document_id] = report
    return report


def _run_job(job_id: str, filename: str, content: bytes) -> None:
    jobs[job_id]["status"] = "processing"
    try:
        report = run_analysis(filename, content)
        reports[report.document_id] = report
        jobs[job_id].update({"status": "complete", "document_id": report.document_id})
    except Exception as exc:
        jobs[job_id].update({"status": "failed", "error": str(exc)})


@app.post("/api/v1/documents/analyze/async", status_code=202)
async def queue_document_analysis(background_tasks: BackgroundTasks, file: UploadFile = File(...)) -> dict[str, str]:
    if not file.filename:
        raise HTTPException(400, "A filename is required.")
    content = await file.read()
    job_id = str(__import__("uuid").uuid4())
    jobs[job_id] = {"status": "queued"}
    background_tasks.add_task(_run_job, job_id, file.filename, content)
    return {"job_id": job_id, "status": "queued"}


@app.get("/api/v1/jobs/{job_id}")
async def get_job(job_id: str) -> dict:
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(404, "Analysis job not found.")
    return job


@app.get("/api/v1/documents/{document_id}", response_model=Report)
async def get_document(document_id: str) -> Report:
    report = reports.get(document_id)
    if not report:
        raise HTTPException(404, "Document report not found.")
    return report
