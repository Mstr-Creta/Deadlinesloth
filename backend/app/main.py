import io
import os
import uuid
from datetime import date, datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pypdf import PdfReader

from .ai import extract_with_gemma, model_name, ollama_client
from .demo_data import demo_catalog, demo_mode, get_demo
from .planner import build_plan
from .schemas import PlanResult
from .storage import get_plan, list_plans, save_plan


load_dotenv(Path(__file__).resolve().parents[1] / ".env")
app = FastAPI(title="Assignment Deadline Sloth API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:4173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def file_text(upload: UploadFile | None) -> str:
    if upload is None or not upload.filename:
        return ""
    suffix = Path(upload.filename).suffix.lower()
    data = await upload.read()
    if len(data) > 15 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Keep uploads under 15 MB.")
    try:
        if suffix == ".pdf":
            reader = PdfReader(io.BytesIO(data))
            return "\n".join(page.extract_text() or "" for page in reader.pages)
        if suffix in {".txt", ".md"}:
            return data.decode("utf-8-sig")
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Could not read this file: {exc}") from exc
    raise HTTPException(status_code=415, detail="Upload a .txt, .md, or text-based PDF file.")


@app.get("/api/health")
async def health() -> dict:
    available = False
    installed = False
    try:
        response = await ollama_client().list()
        installed = any(item.model == model_name() or item.name == model_name() for item in response.models)
        available = True
    except Exception:
        pass
    return {"api": "ok", "ollama_available": available, "model_installed": installed, "model": model_name()}


@app.get("/", include_in_schema=False, response_model=None)
async def root() -> dict | FileResponse:
    dist = Path(__file__).resolve().parents[2] / "frontend" / "dist"
    if dist.exists():
        return FileResponse(dist / "index.html")
    return {"message": "The API is running. Open the React app at http://localhost:5173.", "api_docs": "/docs", "health": "/api/health"}


@app.post("/api/plan", response_model=PlanResult)
async def create_plan(
    current_date: date = Form(...),
    available_hours: float = Form(3, ge=0.5, le=16),
    user_mode: str = Form("universal"),
    source_mode: str = Form("gemma"),
    demo_type: str = Form("student"),
    text: str = Form(""),
    upload: UploadFile | None = File(default=None),
) -> PlanResult:
    uploaded_text = await file_text(upload)
    source_text = "\n\n".join(part for part in (text.strip(), uploaded_text.strip()) if part)
    plan_mode = user_mode
    if source_mode == "demo":
        source_text, extraction = get_demo(demo_type)
        plan_mode = demo_mode(demo_type)
    else:
        if not source_text:
            raise HTTPException(status_code=422, detail="Paste text, upload a file, or try a demo first.")
        if len(source_text) > 120_000:
            raise HTTPException(status_code=413, detail="Keep combined source text under 120,000 characters.")
        try:
            extraction = await extract_with_gemma(source_text, current_date.isoformat(), user_mode)
        except Exception as exc:
            message = str(exc)
            if "connect" in message.lower() or "ollama" in message.lower():
                raise HTTPException(status_code=503, detail="Ollama is not reachable. Start the Ollama app, then try again. The demo works without Ollama.") from exc
            raise HTTPException(status_code=502, detail=f"Gemma could not extract tasks: {message}") from exc

    plan = build_plan(extraction, current_date, available_hours, plan_mode)
    plan.id = str(uuid.uuid4())
    plan.created_at = datetime.now(timezone.utc).isoformat()
    payload = plan.model_dump(mode="json")
    save_plan(payload)
    return plan


@app.get("/api/plans")
async def plans() -> list[dict]:
    return list_plans()


@app.get("/api/demos")
async def demos() -> list[dict[str, str]]:
    return demo_catalog()


@app.get("/api/plans/{plan_id}")
async def plan_detail(plan_id: str) -> dict:
    plan = get_plan(plan_id)
    if plan is None:
        raise HTTPException(status_code=404, detail="Saved plan not found.")
    return plan


frontend_dist = Path(__file__).resolve().parents[2] / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/assets", StaticFiles(directory=frontend_dist / "assets"), name="assets")

    @app.get("/{path:path}", include_in_schema=False)
    async def frontend(path: str = "") -> FileResponse:
        target = frontend_dist / path
        return FileResponse(target if target.is_file() else frontend_dist / "index.html")
