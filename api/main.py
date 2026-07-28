"""
VTU Result Scraper -- FastAPI Backend
======================================
Run with: python -m uvicorn api.main:app --reload --port 8000

Frontend: http://localhost:8000
API Docs: http://localhost:8000/docs
"""
import os
import threading
import uuid
import json
from datetime import datetime
from fastapi import FastAPI, HTTPException, Query, Header
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

import urllib3
urllib3.disable_warnings()

from src.batch_runner import generate_usns, run_batch_and_export
from src.database import (
    get_all_results, get_result_by_usn, get_results_count, db
)
from src.exporter import export_to_excel
from src.calculator import calculate_sgpa, calculate_cgpa, get_credits
from src.config import EXPORTS_DIR

# Resolve paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATIC_DIR = os.path.join(BASE_DIR, "static")
os.makedirs(STATIC_DIR, exist_ok=True)

# -- FastAPI App --
app = FastAPI(
    title="VTU Result Scraper API",
    description="Automated VTU exam result scraper with CAPTCHA bypass, revaluation comparison, and Excel export.",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


# -- In-memory job tracking --
jobs = {}


# -- Request/Response Models --

class ScrapeRequest(BaseModel):
    url: str
    college_code: str
    year: str
    branch: str
    start_roll: int
    end_roll: int
    is_reval: bool = False
    delay: float = 0.5
    max_retries: int = 15


class ScrapeResponse(BaseModel):
    job_id: str
    message: str
    total_students: int


# -- Frontend Route --

@app.get("/", response_class=HTMLResponse)
def serve_frontend():
    """Serve the main frontend page."""
    index_path = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_path):
        with open(index_path, "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    return HTMLResponse(content="<h1>Frontend not found. Place index.html in /static/</h1>")

@app.get("/admin", response_class=HTMLResponse)
def serve_admin():
    """Serve the admin frontend page."""
    admin_path = os.path.join(STATIC_DIR, "admin", "index.html")
    if os.path.exists(admin_path):
        with open(admin_path, "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    return HTMLResponse(content="<h1>Admin Frontend not found.</h1>")

# -- API Routes --

@app.post("/api/scrape", response_model=ScrapeResponse)
def start_scrape(req: ScrapeRequest):
    """Start a batch scraping job."""
    
    usns = generate_usns(req.college_code, req.year, req.branch, req.start_roll, req.end_roll)
    
    if not usns:
        raise HTTPException(status_code=400, detail="Invalid roll range: no USNs generated.")
    
    job_id = str(uuid.uuid4())[:8]
    
    jobs[job_id] = {
        "status": "running",
        "progress": 0,
        "total": len(usns),
        "current_usn": None,
        "current_status": None,
        "started_at": datetime.now().isoformat(),
        "summary": None,
        "excel_path": None,
        "results_log": [],
        "usns": usns,  # Store for later export reference
    }
    
    def progress_callback(current, total, usn, status):
        jobs[job_id]["progress"] = current
        jobs[job_id]["current_usn"] = usn
        jobs[job_id]["current_status"] = status
        jobs[job_id]["results_log"].append({"usn": usn, "status": status})
    
    def run_in_background():
        try:
            summary, excel_path = run_batch_and_export(
                url=req.url,
                usns=usns,
                is_reval=req.is_reval,
                delay=req.delay,
                max_retries=req.max_retries,
                progress_callback=progress_callback
            )
            jobs[job_id]["status"] = "completed"
            jobs[job_id]["summary"] = summary
            jobs[job_id]["excel_path"] = excel_path
        except Exception as e:
            jobs[job_id]["status"] = "error"
            jobs[job_id]["summary"] = {"error": str(e)}
    
    thread = threading.Thread(target=run_in_background, daemon=True)
    thread.start()
    
    return ScrapeResponse(
        job_id=job_id,
        message=f"Scraping started for {len(usns)} students.",
        total_students=len(usns)
    )


@app.get("/api/status/{job_id}")
def get_status(job_id: str):
    """Check the progress of a scraping job."""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found.")
    
    job = jobs[job_id]
    return {
        "job_id": job_id,
        "status": job["status"],
        "progress": job["progress"],
        "total": job["total"],
        "percentage": round((job["progress"] / job["total"]) * 100, 1) if job["total"] > 0 else 0,
        "current_usn": job.get("current_usn"),
        "current_status": job.get("current_status"),
        "started_at": job.get("started_at"),
        "summary": job.get("summary"),
        "results_log": job.get("results_log", [])[-15:]  # Last 15 entries
    }


@app.get("/api/results/{usn}")
def get_result(usn: str):
    """Get a single student's result by USN."""
    result = get_result_by_usn(usn.upper())
    if not result:
        raise HTTPException(status_code=404, detail=f"No result found for USN: {usn}")
        
    subjects = result.get("subjects", {})
    if subjects:
        for code, sub in subjects.items():
            sub["credits"] = get_credits(code)
            
        sems = list(set([s.get("semester", 0) for s in subjects.values()]))
        latest_sem = max(sems) if sems else 0
        result["sgpa"], _ = calculate_sgpa(subjects, target_sem=latest_sem)
        result["cgpa"], _ = calculate_cgpa(subjects)
        
        result["sgpa_map"] = {}
        for sem in sems:
            sem_sgpa, _ = calculate_sgpa(subjects, target_sem=sem)
            result["sgpa_map"][sem] = sem_sgpa
    else:
        # Protect database-only CGPA/SGPA values (no subjects list available)
        if "sgpa" not in result or result["sgpa"] is None:
            result["sgpa"] = result.get("cgpa")
        if "sgpa_map" not in result or not result["sgpa_map"]:
            result["sgpa_map"] = {str(sem): result.get("cgpa") for sem in result.get("semesters", [1])}
    
    return result


@app.get("/api/results")
def get_all_results_endpoint():
    """Get all student results with computed SGPA and CGPA."""
    results = get_all_results()
    if not results:
        return {"results": []}
    
    for result in results:
        subjects = result.get("subjects", {})
        if subjects:
            for code, sub in subjects.items():
                sub["credits"] = get_credits(code)
                
            sems = list(set([s.get("semester", 0) for s in subjects.values()]))
            latest_sem = max(sems) if sems else 0
            result["sgpa"], _ = calculate_sgpa(subjects, target_sem=latest_sem)
            result["cgpa"], _ = calculate_cgpa(subjects)
            
            result["sgpa_map"] = {}
            for sem in sems:
                sem_sgpa, _ = calculate_sgpa(subjects, target_sem=sem)
                result["sgpa_map"][sem] = sem_sgpa
        else:
            # Protect database-only CGPA/SGPA values (no subjects list available)
            if "sgpa" not in result or result["sgpa"] is None:
                result["sgpa"] = result.get("cgpa")
            if "sgpa_map" not in result or not result["sgpa_map"]:
                result["sgpa_map"] = {str(sem): result.get("cgpa") for sem in result.get("semesters", [1])}
            
    return {"results": results}



@app.get("/api/export")
def export_all(semester: Optional[int] = None):
    """Export all DB results to Excel. Optional semester filter."""
    results = get_all_results()
    if not results:
        raise HTTPException(status_code=404, detail="No results in database to export.")
    
    if semester:
        filtered = []
        for student in results:
            subjects = student.get("subjects", {})
            sem_subjects = {
                code: sub for code, sub in subjects.items()
                if (sub.get("semester") or 0) == semester
            }
            if sem_subjects:
                filtered.append({
                    **student,
                    "subjects": sem_subjects,
                    "grand_total": sum(s.get("total", 0) for s in sem_subjects.values())
                })
        results = filtered
        prefix = f"Sem{semester}_results"
    else:
        # Build prefix from USN range
        usns = sorted([r.get("usn", "") for r in results if r.get("usn")])
        if usns:
            prefix = f"{usns[0]}_to_{usns[-1]}"
        else:
            prefix = "all_results"
    
    if not results:
        raise HTTPException(status_code=404, detail=f"No results found for semester {semester}.")
    
    excel_path = export_to_excel(results, prefix=prefix)
    if not excel_path or not os.path.exists(excel_path):
        raise HTTPException(status_code=500, detail="Failed to generate Excel file.")
    
    return FileResponse(
        excel_path,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename=os.path.basename(excel_path)
    )


@app.get("/api/export/{job_id}")
def download_export(job_id: str):
    """Download the Excel file generated by a completed job."""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found.")
    
    job = jobs[job_id]
    
    if job["status"] != "completed":
        raise HTTPException(status_code=400, detail=f"Job is still {job['status']}.")
    
    excel_path = job.get("excel_path")
    if not excel_path or not os.path.exists(excel_path):
        raise HTTPException(status_code=404, detail="Excel file not found.")
    
    return FileResponse(
        excel_path,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename=os.path.basename(excel_path)
    )


@app.get("/api/semesters")
def get_semesters():
    """Get list of all semesters available in the database."""
    results = get_all_results()
    sems = set()
    for student in results:
        for code, sub in student.get("subjects", {}).items():
            sem = sub.get("semester") or 0
            if sem > 0:
                sems.add(sem)
    return {"semesters": sorted(sems)}


@app.get("/api/stats")
def get_stats():
    """Get database statistics."""
    count = get_results_count()
    return {
        "total_students": count,
        "active_jobs": sum(1 for j in jobs.values() if j["status"] == "running"),
        "completed_jobs": sum(1 for j in jobs.values() if j["status"] == "completed"),
    }


@app.delete("/api/cleanup")
def cleanup_files():
    """Clean up old export files and temp data."""
    import glob
    
    # Clean exports (keep only latest 3)
    export_files = sorted(
        glob.glob(os.path.join(EXPORTS_DIR, "*.xlsx")),
        key=os.path.getmtime, reverse=True
    )
    removed = 0
    for f in export_files[3:]:
        try:
            os.remove(f)
            removed += 1
        except OSError:
            pass
    
    # Clean temp
    temp_dir = os.path.join(BASE_DIR, "temp")
    if os.path.exists(temp_dir):
        for f in os.listdir(temp_dir):
            try:
                os.remove(os.path.join(temp_dir, f))
                removed += 1
            except OSError:
                pass
    
    # Clean stale jobs (older than completed)
    stale_jobs = [jid for jid, j in jobs.items() if j["status"] in ("completed", "error")]
    for jid in stale_jobs:
        del jobs[jid]
    
    return {
        "files_removed": removed,
        "stale_jobs_cleared": len(stale_jobs),
        "message": f"Cleaned up {removed} files and {len(stale_jobs)} stale jobs."
    }


# -- Admin Authentication and Calendar Events --

class AuthRequest(BaseModel):
    id: str
    password: str

class EventRequest(BaseModel):
    id: int
    title: str
    type: str
    mode: Optional[str] = None
    location: Optional[str] = None
    subtypes: Optional[list] = None
    date: str
    desc: str

class DeleteEventRequest(BaseModel):
    id: int

# JSON File Paths for events
# On Vercel, the project directory is read-only. We use /tmp as writable storage.
IS_VERCEL = os.getenv("VERCEL", "") == "1"
EVENTS_JSON_PATH = os.path.join(BASE_DIR, "calendar_events.json")
EVENTS_EXAMPLE_PATH = os.path.join(BASE_DIR, "calendar_events_example.json")
EVENTS_TMP_PATH = "/tmp/calendar_events.json" if IS_VERCEL else None

def _get_read_path():
    """Return the best available path for reading events."""
    # On Vercel: prefer /tmp copy (has latest edits), then repo file, then example
    if EVENTS_TMP_PATH and os.path.exists(EVENTS_TMP_PATH):
        return EVENTS_TMP_PATH
    if os.path.exists(EVENTS_JSON_PATH):
        return EVENTS_JSON_PATH
    return EVENTS_EXAMPLE_PATH

def _seed_tmp_if_needed():
    """On Vercel, copy repo JSON into /tmp on first access so it's writable."""
    if EVENTS_TMP_PATH and not os.path.exists(EVENTS_TMP_PATH):
        source = EVENTS_JSON_PATH if os.path.exists(EVENTS_JSON_PATH) else EVENTS_EXAMPLE_PATH
        if os.path.exists(source):
            try:
                import shutil
                shutil.copy2(source, EVENTS_TMP_PATH)
            except Exception:
                pass

# Seed /tmp on startup if running on Vercel
if IS_VERCEL:
    _seed_tmp_if_needed()

def load_events_from_json():
    path = _get_read_path()
    if path and os.path.exists(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []
    return []

def save_events_to_json(events):
    # On Vercel, write to /tmp; locally, write to project dir
    target = EVENTS_TMP_PATH if IS_VERCEL else EVENTS_JSON_PATH
    try:
        with open(target, "w", encoding="utf-8") as f:
            json.dump(events, f, indent=2)
        return True
    except Exception:
        return False

# Predefined/configured admin credentials
ADMIN_ID = os.getenv("ADMIN_ID", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")
DUMMY_TOKEN = "dummy-admin-jwt-token"

# Dual-storage configuration: Auto-detect if cloud MongoDB URI is configured
USE_MONGO_FOR_EVENTS = False
mongo_uri_env = os.getenv("MONGO_URI", "")
if mongo_uri_env and ("mongodb+srv://" in mongo_uri_env or ("localhost" not in mongo_uri_env and "127.0.0.1" not in mongo_uri_env)):
    USE_MONGO_FOR_EVENTS = True

# MongoDB collections for events (only connected if needed)
events_collection = None
if USE_MONGO_FOR_EVENTS:
    try:
        events_collection = db["events"]
        # Seed events from JSON if collection is empty
        if events_collection.count_documents({}) == 0:
            example_events = load_events_from_json()
            if example_events:
                events_collection.insert_many(example_events)
    except Exception:
        pass

def verify_token(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization Header")
    try:
        scheme, token = authorization.split(" ")
        if scheme.lower() != "bearer" or token != DUMMY_TOKEN:
            raise HTTPException(status_code=401, detail="Invalid token")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid Authorization Header format")

@app.post("/api/auth")
def admin_auth(req: AuthRequest):
    """Authenticate admin and return JWT-like token."""
    if req.id == ADMIN_ID and req.password == ADMIN_PASSWORD:
        return {"token": DUMMY_TOKEN}
    raise HTTPException(status_code=400, detail="Invalid Admin ID or Password.")

@app.get("/api/verify")
def verify_admin_token(authorization: Optional[str] = Header(None)):
    """Verify admin token validity."""
    if not authorization:
        return {"valid": False, "admin": False}
    try:
        scheme, token = authorization.split(" ")
        if scheme.lower() == "bearer" and token == DUMMY_TOKEN:
            return {"valid": True, "admin": True}
    except Exception:
        pass
    return {"valid": False, "admin": False}

@app.get("/api/events")
def get_calendar_events():
    """Retrieve all calendar events."""
    if USE_MONGO_FOR_EVENTS and events_collection is not None:
        try:
            return list(events_collection.find({}, {"_id": 0}))
        except Exception:
            pass
    return load_events_from_json()

@app.post("/api/events")
def create_calendar_event(req: EventRequest, authorization: Optional[str] = Header(None)):
    """Create a new calendar event."""
    verify_token(authorization)
    event_data = req.dict()
    
    if USE_MONGO_FOR_EVENTS and events_collection is not None:
        try:
            if events_collection.find_one({"id": req.id}):
                raise HTTPException(status_code=400, detail="Event already exists")
            events_collection.insert_one(event_data)
            event_data.pop("_id", None)
            return event_data
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
            
    # Fallback to local JSON
    events = load_events_from_json()
    if any(e.get("id") == req.id for e in events):
        raise HTTPException(status_code=400, detail="Event already exists")
    events.append(event_data)
    if not save_events_to_json(events):
        raise HTTPException(status_code=500, detail="Failed to save event to local file (read-only filesystem)")
    return event_data

@app.put("/api/events")
def update_calendar_event(req: EventRequest, authorization: Optional[str] = Header(None)):
    """Update an existing calendar event."""
    verify_token(authorization)
    event_data = req.dict()
    
    if USE_MONGO_FOR_EVENTS and events_collection is not None:
        try:
            res = events_collection.replace_one({"id": req.id}, event_data)
            if res.matched_count == 0:
                raise HTTPException(status_code=404, detail="Event not found")
            return event_data
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
            
    # Fallback to local JSON
    events = load_events_from_json()
    found = False
    for idx, e in enumerate(events):
        if e.get("id") == req.id:
            events[idx] = event_data
            found = True
            break
    if not found:
        raise HTTPException(status_code=404, detail="Event not found")
    if not save_events_to_json(events):
        raise HTTPException(status_code=500, detail="Failed to save update to local file (read-only filesystem)")
    return event_data

@app.delete("/api/events")
def delete_calendar_event(req: DeleteEventRequest, authorization: Optional[str] = Header(None)):
    """Delete a calendar event."""
    verify_token(authorization)
    
    if USE_MONGO_FOR_EVENTS and events_collection is not None:
        try:
            res = events_collection.delete_one({"id": req.id})
            if res.deleted_count == 0:
                raise HTTPException(status_code=404, detail="Event not found")
            return {"status": "success", "message": "Event deleted"}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
            
    # Fallback to local JSON
    events = load_events_from_json()
    initial_len = len(events)
    events = [e for e in events if e.get("id") != req.id]
    if len(events) == initial_len:
        raise HTTPException(status_code=404, detail="Event not found")
    if not save_events_to_json(events):
        raise HTTPException(status_code=500, detail="Failed to save deletion to local file (read-only filesystem)")
    return {"status": "success", "message": "Event deleted"}
