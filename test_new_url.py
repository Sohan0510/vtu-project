"""
Test the fixed scraper against the new VTU URL.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.scraper import fetch_student_result
import json

URL = "https://results.vtu.ac.in/MJ26cbcs/index.php"
USN = "1RF23CS001"

print(f"Testing scraper with URL: {URL}")
print(f"USN: {USN}")
print("=" * 60)

result = fetch_student_result(USN, URL, max_retries=15)

if "error" in result:
    print(f"\nERROR: {result['error']}")
else:
    print(f"\nSUCCESS!")
    print(f"  Name: {result.get('name')}")
    print(f"  USN: {result.get('usn')}")
    print(f"  Attempts: {result.get('attempts')}")
    print(f"  Grand Total: {result.get('grand_total')}")
    print(f"  Reval Status: {result.get('reval_status', 'N/A')}")
    print(f"\n  Subjects ({len(result.get('subjects', {}))}):")
    for code, sub in result.get('subjects', {}).items():
        print(f"    {code}: {sub['name']} | I:{sub['internals']} E:{sub['externals']} T:{sub['total']} | {sub['status']} | Sem:{sub['semester']}")

print("\nDone!")
