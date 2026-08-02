"""
MongoDB Database Layer
=======================
Handles all student result storage and retrieval.

Key design: Subjects from different semesters ACCUMULATE in one document.
Each subject is keyed by its code (e.g. BCS501). Scraping a new semester
URL won't delete subjects from other semesters already stored.

Backlog Tracking:
- active_backlogs: list of currently-failed subject codes with origin info
- backlog_history: array tracking each F→P transition (cleared backlogs)
- active_backlog_count: count of currently-failed subjects
- historical_backlogs: True if student EVER had any backlog, even if all cleared
"""

# pyrefly: ignore [missing-import]
from pymongo import MongoClient, ASCENDING
from src.config import MONGO_URI, DB_NAME
from datetime import datetime

# Connect to MongoDB
client = MongoClient(MONGO_URI)
db = client[DB_NAME]
collection = db["results"]

# Create indexes for fast lookups
collection.create_index("usn", unique=True)
collection.create_index([("name", ASCENDING)])


def _compute_backlog_state(merged_subjects):
    """
    Computes active backlogs from the current merged subjects dict.
    Returns (active_backlogs_list, active_backlog_count).
    """
    active = []
    for code, sub in merged_subjects.items():
        if sub.get("status") in ("F", "A"):
            active.append({
                "code": code,
                "name": sub.get("name", ""),
                "semester": sub.get("semester", 0),
            })
    return active, len(active)


def get_semester_from_url(url, default_val=0):
    """
    Returns the semester number (int) or exam label (str) from a VTU result URL.
    """
    if not url:
        return default_val
    u = str(url).lower()
    if "djcbcs24" in u or "djrvcbcs24" in u:
        return 1
    if "jjecbcs24" in u or "jjrvcbcs24" in u:
        return 2
    if "makeupecbcs24" in u:
        return "2 (Makeup '24)"
    if "djcbcs25" in u or "djrvcbcs25" in u:
        return 3
    if "jjecbcs25" in u or "jjrvcbcs25" in u:
        return 4
    if "makeupecbcs25" in u:
        return "4 (Makeup '25)"
    if "secbcs25" in u or "servcbcs25" in u:
        return "4 (Summer '25)"
    if "d25j26ecbcs" in u or "d25j26rvcbcs" in u:
        return 5
    if "mj26cbcs" in u or "mj26rvcbcs" in u:
        return 6
    return default_val


def _to_int_sem(val):
    if isinstance(val, int):
        return val
    if isinstance(val, str):
        for ch in str(val):
            if ch.isdigit():
                return int(ch)
    return 0


def _detect_backlog_clearances(old_subjects, new_subjects, new_url):
    """
    Detects subjects that transitioned from F/A → P between old and new scrape.
    Returns list of clearance records based on the URL / semester session.
    """
    clearances = []
    now = datetime.utcnow().isoformat()
    
    # Identify what session/semester this new_url represents
    max_scrape_sem = max((s.get("semester", 0) for s in new_subjects.values()), default=0)
    cleared_sem_from_url = get_semester_from_url(new_url, default_val=0)
    
    for code, new_data in new_subjects.items():
        old_data = old_subjects.get(code)
        if not old_data:
            continue
        
        old_status = old_data.get("status", "")
        new_status = new_data.get("status", "")
        
        # F/A → P means a backlog was cleared
        if old_status in ("F", "A") and new_status == "P":
            old_sem = old_data.get("semester", 0)
            
            if cleared_sem_from_url != 0:
                cleared_sem = cleared_sem_from_url
            else:
                cleared_sem = max(old_sem + 1, max_scrape_sem) if max_scrape_sem > old_sem else old_sem + 1
            
            c_int = _to_int_sem(cleared_sem)
            f_int = _to_int_sem(old_sem)
            duration = max(1, c_int - f_int) if (c_int and f_int and c_int >= f_int) else 1
            
            clearances.append({
                "code": code,
                "name": new_data.get("name", old_data.get("name", "")),
                "failed_in_sem": old_sem,
                "cleared_in_sem": cleared_sem,
                "cleared_in_url": new_url,
                "cleared_at": now,
                "duration_semesters": duration,
            })
    
    return clearances


def save_or_update_result(student_data, is_reval=False):
    """
    Saves a new student record or MERGES into an existing one.
    
    Name handling:
    - Always updates the name if the new scrape has a non-empty name
    - Keeps the existing name if the new scrape returns empty
    
    For revaluation runs:
    - Compares EACH subject's total marks individually
    - Only updates subjects where new marks > old marks
    
    Backlog tracking:
    - Detects F→P transitions and records them in backlog_history
    - Maintains active_backlogs, active_backlog_count, historical_backlogs
    
    Returns (status_string, message_string).
    """
    usn = student_data.get("usn")
    if not usn:
        return "error", "Invalid data: No USN found."

    existing_record = collection.find_one({"usn": usn})
    now = datetime.utcnow().isoformat()
    new_subjects = student_data.get("subjects", {})
    new_url = student_data.get("url_source", "")
    new_name = student_data.get("name", "").strip()

    # Mark all incoming subjects as not reval-updated
    for sub_code in new_subjects:
        new_subjects[sub_code]["reval_updated"] = False

    # ── NEW ENTRY ──
    if not existing_record:
        semesters_found = sorted(set(
            s.get("semester", 0) for s in new_subjects.values()
        ))
        
        # Compute initial backlog state
        active_backlogs, active_backlog_count = _compute_backlog_state(new_subjects)
        has_any_fail = active_backlog_count > 0
        
        student_data["scraped_at"] = now
        student_data["last_updated"] = now
        student_data["reval_changes"] = []
        student_data["url_sources"] = [new_url] if new_url else []
        student_data["semesters"] = semesters_found
        student_data["subjects"] = new_subjects
        student_data["grand_total"] = sum(
            s.get("total", 0) for s in new_subjects.values()
        )
        student_data["backlog_history"] = []
        student_data["active_backlogs"] = active_backlogs
        student_data["active_backlog_count"] = active_backlog_count
        student_data["historical_backlogs"] = has_any_fail
        
        collection.insert_one(student_data)
        sem_label = ", ".join(str(s) for s in semesters_found) if semesters_found else "?"
        if student_data.get("reval_status") == "Not Applied":
            return "not_applied", f"[-] Not applied for reval: {usn}"
        return "inserted", f"[+] New: {usn} ({new_name or '?'}) Sem {sem_label}"

    # ── EXISTING ENTRY ──
    old_subjects = existing_record.get("subjects", {})
    old_url_sources = existing_record.get("url_sources", [])
    
    # Name resolution: prefer non-empty name, prioritize new scrape data
    existing_name = existing_record.get("name", "").strip()
    resolved_name = new_name if new_name else existing_name

    if is_reval:
        if student_data.get("reval_status") == "Not Applied":
            collection.update_one({"usn": usn}, {"$set": {"reval_status": "Not Applied", "last_updated": now}})
            return "not_applied", f"[-] Not applied for reval: {usn}"
            
        return _handle_reval_update(
            usn, resolved_name, new_subjects, old_subjects,
            existing_record, old_url_sources, new_url, now, student_data.get("reval_status")
        )
    else:
        return _handle_normal_merge(
            usn, resolved_name, new_subjects, old_subjects,
            existing_record, old_url_sources, new_url, now
        )


def _handle_reval_update(usn, name, new_subjects, old_subjects,
                          existing_record, old_url_sources, new_url, now, reval_status):
    """Revaluation: compare per-subject, only update if marks improved."""
    merged_subjects = dict(old_subjects)
    updates_made = []
    
    for sub_code, new_data in new_subjects.items():
        old_data = old_subjects.get(sub_code, {})
        old_total = old_data.get("total", 0)
        new_total = new_data.get("total", 0)
        
        if sub_code not in old_subjects:
            # New subject not in DB — add it
            merged_subjects[sub_code] = new_data
            updates_made.append(f"  NEW: {sub_code} = {new_total}")
        elif new_total > old_total:
            # Marks improved — update with reval data
            new_data["reval_updated"] = True
            new_data["old_total"] = old_total
            merged_subjects[sub_code] = new_data
            updates_made.append(f"  UP:  {sub_code} {old_total} -> {new_total}")
    
    if updates_made:
        grand_total = sum(s.get("total", 0) for s in merged_subjects.values())
        semesters = sorted(set(
            s.get("semester", 0) for s in merged_subjects.values()
        ))
        
        reval_log = {
            "date": now,
            "changes": updates_made,
            "old_grand_total": existing_record.get("grand_total", 0),
            "new_grand_total": grand_total
        }
        
        url_sources = list(set(old_url_sources + ([new_url] if new_url else [])))
        
        # Detect backlog clearances from reval (F→P due to mark improvement)
        new_clearances = _detect_backlog_clearances(old_subjects, merged_subjects, new_url)
        old_history = existing_record.get("backlog_history", [])
        backlog_history = old_history + new_clearances
        
        # Compute new backlog state
        active_backlogs, active_backlog_count = _compute_backlog_state(merged_subjects)
        had_historical = existing_record.get("historical_backlogs", False)
        historical_backlogs = had_historical or len(new_clearances) > 0
        
        collection.update_one(
            {"usn": usn},
            {"$set": {
                "subjects": merged_subjects,
                "grand_total": grand_total,
                "semesters": semesters,
                "last_updated": now,
                "url_sources": url_sources,
                "name": name,
                "reval_status": reval_status,
                "backlog_history": backlog_history,
                "active_backlogs": active_backlogs,
                "active_backlog_count": active_backlog_count,
                "historical_backlogs": historical_backlogs,
            },
            "$push": {"reval_changes": reval_log}}
        )
        return "updated", f"[^] Reval {usn}: {len(updates_made)} subjects updated"
    else:
        # Update name and reval_status even if marks are unchanged
        update_fields = {"last_updated": now}
        if name and name != existing_record.get("name", "").strip():
            update_fields["name"] = name
        if reval_status:
            update_fields["reval_status"] = reval_status
            
        collection.update_one({"usn": usn}, {"$set": update_fields})
        return "unchanged", f"[-] No improvement for {usn}"


def _handle_normal_merge(usn, name, new_subjects, old_subjects,
                          existing_record, old_url_sources, new_url, now):
    """Normal scrape: merge new subjects into existing record with backlog tracking."""
    merged_subjects = dict(old_subjects)
    new_count = 0
    updated_count = 0
    
    # Detect backlog clearances BEFORE merging (compare old state vs new incoming)
    new_clearances = _detect_backlog_clearances(old_subjects, new_subjects, new_url)
    
    for sub_code, new_data in new_subjects.items():
        if sub_code not in old_subjects:
            new_count += 1
        else:
            updated_count += 1
        merged_subjects[sub_code] = new_data
    
    grand_total = sum(s.get("total", 0) for s in merged_subjects.values())
    semesters = sorted(set(
        s.get("semester", 0) for s in merged_subjects.values()
    ))
    url_sources = list(set(old_url_sources + ([new_url] if new_url else [])))
    
    # Update backlog tracking
    old_history = existing_record.get("backlog_history", [])
    backlog_history = old_history + new_clearances
    
    # Compute current backlog state from merged subjects
    active_backlogs, active_backlog_count = _compute_backlog_state(merged_subjects)
    
    # Historical flag: true if student EVER had a backlog
    had_historical = existing_record.get("historical_backlogs", False)
    # Also check if ANY old subjects were F (they might now be overwritten as P)
    had_old_fails = any(s.get("status") in ("F", "A") for s in old_subjects.values())
    historical_backlogs = had_historical or had_old_fails or len(new_clearances) > 0 or active_backlog_count > 0
    
    collection.update_one(
        {"usn": usn},
        {"$set": {
            "subjects": merged_subjects,
            "grand_total": grand_total,
            "semesters": semesters,
            "last_updated": now,
            "url_sources": url_sources,
            "name": name,
            "reval_changes": existing_record.get("reval_changes", []),
            "backlog_history": backlog_history,
            "active_backlogs": active_backlogs,
            "active_backlog_count": active_backlog_count,
            "historical_backlogs": historical_backlogs,
        }}
    )
    
    kept = len(old_subjects) - updated_count
    clearance_msg = f", {len(new_clearances)} backlogs cleared" if new_clearances else ""
    backlog_msg = f", {active_backlog_count} active backlogs" if active_backlog_count > 0 else ""
    return "merged", f"[+] Merged {usn}: +{new_count} new, {updated_count} refreshed, {kept} kept{clearance_msg}{backlog_msg}"


def _repair_student_record(record):
    """
    Auto-fixes cleared_in_sem and duration_semesters in backlog_history
    if cleared_in_url is present, resolving historical same-sem bugs.
    """
    if not record or "backlog_history" not in record:
        return record
    for entry in record["backlog_history"]:
        cleared_url = entry.get("cleared_in_url", "")
        if cleared_url:
            sem_from_url = get_semester_from_url(cleared_url, default_val=0)
            if sem_from_url != 0:
                entry["cleared_in_sem"] = sem_from_url
            failed_sem = entry.get("failed_in_sem", 0)
            c_int = _to_int_sem(entry.get("cleared_in_sem"))
            f_int = _to_int_sem(failed_sem)
            if c_int and f_int and c_int >= f_int:
                entry["duration_semesters"] = max(1, c_int - f_int)
    return record


def get_all_results(url_filter=None):
    """Returns all student records from the database."""
    query = {}
    if url_filter:
        query["url_sources"] = url_filter
    results = list(collection.find(query, {"_id": 0}))
    return [_repair_student_record(r) for r in results]


def get_result_by_usn(usn):
    """Returns a single student record by USN."""
    record = collection.find_one({"usn": usn}, {"_id": 0})
    return _repair_student_record(record) if record else None


def get_results_count():
    """Returns the total number of records."""
    return collection.count_documents({})


def get_results_by_usn_range(usns):
    """Returns student records for a list of USNs, preserving order."""
    results = list(collection.find({"usn": {"$in": usns}}, {"_id": 0}))
    usn_order = {u: i for i, u in enumerate(usns)}
    results.sort(key=lambda r: usn_order.get(r.get("usn", ""), 999))
    return [_repair_student_record(r) for r in results]


def delete_all_results():
    """Clears all records. Use with caution."""
    result = collection.delete_many({})
    return result.deleted_count