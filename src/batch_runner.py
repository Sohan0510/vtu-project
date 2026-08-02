"""
Batch Runner
=============
Orchestrates batch scraping of multiple USNs with automatic retry,
progress callbacks, and Excel export.
"""

import sys
import io
import os
import time
import glob
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from src.scraper import fetch_student_result
from src.database import save_or_update_result, get_results_by_usn_range
from src.exporter import export_to_excel
from src.config import EXPORTS_DIR, TEMP_DIR

# Fix Windows console encoding for Unicode
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')


def generate_usns(college_code, year, branch, start_roll, end_roll):
    """
    Generates a list of USNs from the pattern.
    Example: generate_usns("1RF", "23", "CS", 1, 5) -> ["1RF23CS001", ..., "1RF23CS005"]
    """
    usns = []
    for roll in range(start_roll, end_roll + 1):
        usn = f"{college_code}{year}{branch}{roll:03d}"
        usns.append(usn.upper())
    return usns


def _cleanup_old_exports(prefix, keep_latest=2):
    """Remove old export files, keeping only the latest N."""
    pattern = os.path.join(EXPORTS_DIR, f"{prefix}*.xlsx")
    files = sorted(glob.glob(pattern), key=os.path.getmtime, reverse=True)
    for old_file in files[keep_latest:]:
        try:
            os.remove(old_file)
        except OSError:
            pass


def _cleanup_temp():
    """Remove all files from the temp directory."""
    if os.path.exists(TEMP_DIR):
        for f in os.listdir(TEMP_DIR):
            try:
                os.remove(os.path.join(TEMP_DIR, f))
            except OSError:
                pass


def _process_single_usn(usn, url, is_reval, max_retries):
    """
    Processes a single USN: scrape -> save to DB.
    Returns (status_string, detail_dict_or_none).
    """
    result = fetch_student_result(usn, url, max_retries=max_retries)
    
    if "error" in result:
        error_msg = result["error"]
        if "not found" in error_msg.lower():
            print(f"   [!] {usn}: Not found / no results")
            return "not_found", None
        else:
            print(f"   [X] {usn}: {error_msg}")
            return "failed", None
    
    # Save to MongoDB
    db_status, db_msg = save_or_update_result(
        {
            "usn": result["usn"],
            "name": result["name"],
            "subjects": result["subjects"],
            "grand_total": result["grand_total"],
            "url_source": url,
            "reval_status": result.get("reval_status")
        },
        is_reval=is_reval
    )
    print(f"   {db_msg}")
    
    if db_status == "not_applied":
        detail = {
            "usn": usn,
            "name": result["name"],
            "grand_total": result["grand_total"],
            "subjects_count": len(result["subjects"]),
            "attempts": result.get("attempts", 0),
            "db_status": db_status
        }
        return "success", detail
    
    if db_status == "unchanged":
        return "unchanged", None
    
    detail = {
        "usn": usn,
        "name": result["name"],
        "grand_total": result["grand_total"],
        "subjects_count": len(result["subjects"]),
        "attempts": result.get("attempts", 0),
        "db_status": db_status
    }
    print(f"   [OK] {usn}: {result['name']} -- Total: {result['grand_total']} (Attempt {result.get('attempts', '?')})")
    
    if db_status == "updated":
        return "updated", detail
    return "success", detail


def run_batch(url, usns, is_reval=False, delay=0.5, max_retries=15,
              retry_rounds=2, progress_callback=None):
    """
    Processes a batch of USNs with automatic retry rounds for failures.
    """
    total = len(usns)
    results = {
        "success": [],
        "failed": [],
        "not_found": [],
        "unchanged": [],
    }
    
    start_time = time.time()
    processed_count = 0
    
    print(f"\n{'='*60}")
    print(f"  VTU RESULT SCRAPER -- {'REVALUATION' if is_reval else 'BATCH'} MODE")
    print(f"  URL: {url}")
    print(f"  Students: {total}  |  Retry rounds: {retry_rounds}")
    print(f"  Started: {datetime.now().strftime('%I:%M:%S %p')}")
    print(f"{'='*60}\n")
    
    pending_usns = list(usns)
    
    for round_num in range(1, 2 + retry_rounds):
        if not pending_usns:
            break
        
        round_label = "INITIAL PASS" if round_num == 1 else f"RETRY ROUND {round_num - 1}/{retry_rounds}"
        print(f"\n  --- {round_label} ({len(pending_usns)} students) ---\n")
        
        failed_this_round = []
        lock = threading.Lock()
        
        def _worker(usn_val):
            return usn_val, _process_single_usn(usn_val, url, is_reval, max_retries)
        
        with ThreadPoolExecutor(max_workers=8) as executor:
            future_to_usn = {
                executor.submit(_worker, usn): usn
                for usn in pending_usns
            }
            for future in as_completed(future_to_usn):
                usn_val = future_to_usn[future]
                try:
                    res_usn, (status, detail) = future.result()
                except Exception as e:
                    print(f"   [!] Exception for {usn_val}: {e}")
                    status, detail = "failed", None
                
                with lock:
                    processed_count += 1
                    print(f"[{processed_count}/{total}] Processed {usn_val} -> {status} ({round_label})")
                    
                    if status == "success" or status == "updated":
                        results["success"].append(detail)
                    elif status == "not_found":
                        results["not_found"].append(usn_val)
                    elif status == "unchanged":
                        results["unchanged"].append(usn_val)
                    elif status == "failed":
                        failed_this_round.append(usn_val)
                    
                    status_to_report = status
                    if status == "failed" and round_num <= retry_rounds:
                        status_to_report = "redoing"
                    
                    if progress_callback:
                        progress_callback(
                            min(processed_count, total),
                            total, usn_val, status_to_report,
                            detail=detail,
                            round_label=round_label
                        )
        
        if not failed_this_round:
            print(f"\n  --- No failures! Skipping remaining retries. ---")
            break
        
        if round_num <= retry_rounds:
            print(f"\n  --- {len(failed_this_round)} failed. Will retry... ---")
            pending_usns = failed_this_round
            time.sleep(2)
        else:
            results["failed"].extend(failed_this_round)
    
    elapsed = time.time() - start_time
    
    print(f"\n{'='*60}")
    print(f"  BATCH COMPLETE")
    print(f"{'='*60}")
    print(f"  Success:    {len(results['success'])}")
    print(f"  Failed:     {len(results['failed'])}")
    print(f"  Not Found:  {len(results['not_found'])}")
    if is_reval:
        print(f"  Unchanged:  {len(results['unchanged'])}")
    print(f"  Time:       {elapsed:.1f}s ({elapsed/60:.1f} min)")
    print(f"{'='*60}")
    
    if results["failed"]:
        print(f"\n  Still failed after retries: {', '.join(results['failed'])}")
    
    # Cleanup temp files after batch
    _cleanup_temp()
    
    return {
        "success_count": len(results["success"]),
        "failed_count": len(results["failed"]),
        "not_found_count": len(results["not_found"]),
        "unchanged_count": len(results["unchanged"]),
        "elapsed_seconds": elapsed,
        "details": results
    }


def run_batch_and_export(url, usns, is_reval=False, delay=0.5, max_retries=15,
                          retry_rounds=2, export_prefix="results",
                          progress_callback=None):
    """
    Runs the batch scraper AND exports results to Excel.
    Excel filename uses the USN range (e.g., 1RF23CS001_to_1RF23CS005).
    Only exports the USNs from this batch, not the entire DB.
    """
    summary = run_batch(
        url=url,
        usns=usns,
        is_reval=is_reval,
        delay=delay,
        max_retries=max_retries,
        retry_rounds=retry_rounds,
        progress_callback=progress_callback
    )
    
    # Export only the USNs from this batch
    batch_results = get_results_by_usn_range(usns)
    
    excel_path = None
    if batch_results:
        # Build filename from USN range: e.g. 1RF23CS001_to_1RF23CS005
        first_usn = usns[0]
        last_usn = usns[-1]
        range_prefix = f"{first_usn}_to_{last_usn}"
        
        # Cleanup old exports for this range
        _cleanup_old_exports(range_prefix, keep_latest=1)
        
        excel_path = export_to_excel(batch_results, prefix=range_prefix)
    else:
        print("\n[!] No results in database to export.")
    
    return summary, excel_path


def run_queue_batch(queue_entries, usns, delay=0.5, max_retries=20,
                    retry_rounds=3, progress_callback=None):
    """
    Processes a queue of URLs sequentially.
    Each URL is fully completed (with retries) before moving to the next.
    
    CRITICAL: If a URL fails for a student, it retries IMMEDIATELY for that URL
    (all retry rounds) before proceeding to the next URL. This ensures correct
    chronological backlog detection.
    """
    queue_total = len(queue_entries)
    overall_start = time.time()
    
    queue_results = []
    overall_summary = {
        "total_urls": queue_total,
        "completed_urls": 0,
        "total_success": 0,
        "total_failed": 0,
        "total_not_found": 0,
        "total_unchanged": 0,
        "url_results": [],
    }
    
    print(f"\n{'='*60}")
    print(f"  VTU MULTI-URL QUEUE SCRAPER")
    print(f"  URLs in queue: {queue_total}")
    print(f"  Students per URL: {len(usns)}")
    print(f"  Started: {datetime.now().strftime('%I:%M:%S %p')}")
    print(f"{'='*60}\n")
    
    for q_idx, entry in enumerate(queue_entries):
        url = entry["url"]
        label = entry.get("label", f"URL {q_idx + 1}")
        is_reval = entry.get("is_reval", False)
        
        print(f"\n{'─'*60}")
        print(f"  QUEUE [{q_idx + 1}/{queue_total}]: {label}")
        print(f"  URL: {url}")
        print(f"  Mode: {'REVALUATION' if is_reval else 'REGULAR'}")
        print(f"{'─'*60}\n")
        
        # Wrap progress callback to include queue-level info
        def make_queue_callback(qi, ql, q_url):
            def cb(current, total, usn, status, detail=None, round_label=None):
                if progress_callback:
                    progress_callback(qi, queue_total, ql, q_url, current, total, usn, status, detail=detail, round_label=round_label)
            return cb
        
        url_summary = run_batch(
            url=url,
            usns=usns,
            is_reval=is_reval,
            delay=delay,
            max_retries=max_retries,
            retry_rounds=retry_rounds,
            progress_callback=make_queue_callback(q_idx, label, url)
        )
        
        url_result = {
            "index": q_idx,
            "label": label,
            "url": url,
            "is_reval": is_reval,
            "summary": url_summary,
        }
        queue_results.append(url_result)
        
        overall_summary["completed_urls"] += 1
        overall_summary["total_success"] += url_summary.get("success_count", 0)
        overall_summary["total_failed"] += url_summary.get("failed_count", 0)
        overall_summary["total_not_found"] += url_summary.get("not_found_count", 0)
        overall_summary["total_unchanged"] += url_summary.get("unchanged_count", 0)
        overall_summary["url_results"].append(url_result)
        
        # Small delay between URLs
        if q_idx < queue_total - 1:
            print(f"\n  Pausing 3s before next URL...")
            time.sleep(3)
    
    overall_elapsed = time.time() - overall_start
    overall_summary["elapsed_seconds"] = overall_elapsed
    
    print(f"\n{'='*60}")
    print(f"  QUEUE COMPLETE — ALL {queue_total} URLs PROCESSED")
    print(f"{'='*60}")
    print(f"  Total Success:   {overall_summary['total_success']}")
    print(f"  Total Failed:    {overall_summary['total_failed']}")
    print(f"  Total Not Found: {overall_summary['total_not_found']}")
    print(f"  Total Unchanged: {overall_summary['total_unchanged']}")
    print(f"  Total Time:      {overall_elapsed:.1f}s ({overall_elapsed/60:.1f} min)")
    print(f"{'='*60}\n")
    
    # Export final results after all URLs processed
    batch_results = get_results_by_usn_range(usns)
    excel_path = None
    if batch_results:
        first_usn = usns[0]
        last_usn = usns[-1]
        range_prefix = f"QUEUE_{first_usn}_to_{last_usn}"
        _cleanup_old_exports(range_prefix, keep_latest=1)
        excel_path = export_to_excel(batch_results, prefix=range_prefix)
    
    return overall_summary, excel_path
