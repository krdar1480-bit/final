#!/usr/bin/env python3
"""
Backend API Testing Script for Exams Made Easy
Tests all endpoints as specified in the review request
"""

import requests
import json
import sys
from pathlib import Path

# Load backend URL from frontend .env
env_file = Path("/app/frontend/.env")
BACKEND_URL = None
if env_file.exists():
    for line in env_file.read_text().splitlines():
        if line.startswith("REACT_APP_BACKEND_URL="):
            BACKEND_URL = line.split("=", 1)[1].strip()
            break

if not BACKEND_URL:
    print("❌ ERROR: Could not find REACT_APP_BACKEND_URL in /app/frontend/.env")
    sys.exit(1)

API_BASE = f"{BACKEND_URL}/api"
print(f"🔍 Testing backend at: {API_BASE}\n")

# Test results tracking
tests_passed = 0
tests_failed = 0
test_details = []


def test_endpoint(name, method, url, expected_status=200, check_data=None, json_data=None):
    """Test a single endpoint"""
    global tests_passed, tests_failed
    
    try:
        if method == "GET":
            response = requests.get(url, timeout=10)
        elif method == "POST":
            response = requests.post(url, json=json_data, timeout=10)
        else:
            raise ValueError(f"Unsupported method: {method}")
        
        # Check status code
        if response.status_code != expected_status:
            print(f"❌ {name}")
            print(f"   Expected status {expected_status}, got {response.status_code}")
            if response.status_code >= 400:
                print(f"   Response: {response.text[:200]}")
            tests_failed += 1
            test_details.append({"name": name, "status": "FAILED", "reason": f"Status {response.status_code}"})
            return None
        
        # Parse JSON response
        try:
            data = response.json()
        except:
            # For image endpoints, check content type
            if "image" in response.headers.get("Content-Type", ""):
                print(f"✅ {name} - Image served successfully")
                tests_passed += 1
                test_details.append({"name": name, "status": "PASSED"})
                return response.content
            else:
                print(f"❌ {name}")
                print(f"   Could not parse JSON response")
                tests_failed += 1
                test_details.append({"name": name, "status": "FAILED", "reason": "Invalid JSON"})
                return None
        
        # Run custom checks
        if check_data:
            check_result = check_data(data)
            if check_result is not True:
                print(f"❌ {name}")
                print(f"   Data validation failed: {check_result}")
                tests_failed += 1
                test_details.append({"name": name, "status": "FAILED", "reason": check_result})
                return None
        
        print(f"✅ {name}")
        tests_passed += 1
        test_details.append({"name": name, "status": "PASSED"})
        return data
        
    except requests.exceptions.Timeout:
        print(f"❌ {name}")
        print(f"   Request timeout")
        tests_failed += 1
        test_details.append({"name": name, "status": "FAILED", "reason": "Timeout"})
        return None
    except Exception as e:
        print(f"❌ {name}")
        print(f"   Exception: {str(e)}")
        tests_failed += 1
        test_details.append({"name": name, "status": "FAILED", "reason": str(e)})
        return None


print("=" * 70)
print("BACKEND API TESTS")
print("=" * 70)
print()

# Test 1: Health check
print("1️⃣  Testing health check endpoint...")
test_endpoint(
    "GET /api/",
    "GET",
    f"{API_BASE}/",
    check_data=lambda d: True if "message" in d else "Missing 'message' field"
)
print()

# Test 2: Get subjects list
print("2️⃣  Testing subjects list endpoint...")
subjects_data = test_endpoint(
    "GET /api/subjects",
    "GET",
    f"{API_BASE}/subjects",
    check_data=lambda d: True if isinstance(d, list) and len(d) > 0 and "patterns" in d[0] else "Invalid subjects data"
)
print()

# Test 3: Get specific subject detail
print("3️⃣  Testing subject detail endpoint...")
if subjects_data and len(subjects_data) > 0:
    subject_id = subjects_data[0]["id"]
    test_endpoint(
        f"GET /api/subjects/{subject_id}",
        "GET",
        f"{API_BASE}/subjects/{subject_id}",
        check_data=lambda d: True if "id" in d and "patterns" in d else "Invalid subject detail"
    )
else:
    print("⚠️  Skipping subject detail test (no subjects found)")
    tests_failed += 1
print()

# Test 4: Get subject analytics
print("4️⃣  Testing subject analytics endpoint...")
if subjects_data and len(subjects_data) > 0:
    subject_id = subjects_data[0]["id"]
    test_endpoint(
        f"GET /api/subjects/{subject_id}/analytics",
        "GET",
        f"{API_BASE}/subjects/{subject_id}/analytics",
        check_data=lambda d: True if "subject" in d and "total_marks" in d else "Invalid analytics data"
    )
else:
    print("⚠️  Skipping analytics test (no subjects found)")
    tests_failed += 1
print()

# Test 5: Get patterns
print("5️⃣  Testing patterns endpoint...")
test_endpoint(
    "GET /api/patterns",
    "GET",
    f"{API_BASE}/patterns",
    check_data=lambda d: True if isinstance(d, list) and len(d) > 0 else "Invalid patterns data"
)
print()

# Test 6: Get quiz (RE-NEET 2026)
print("6️⃣  Testing quiz endpoint (reexam-2026)...")
quiz_data = test_endpoint(
    "GET /api/quiz/reexam-2026",
    "GET",
    f"{API_BASE}/quiz/reexam-2026",
    check_data=lambda d: True if "questions" in d and len(d["questions"]) == 180 else f"Expected 180 questions, got {len(d.get('questions', []))}"
)
print()

# Test 7: Get full paper with solutions
print("7️⃣  Testing full paper endpoint (reexam-2026)...")
full_paper_data = test_endpoint(
    "GET /api/full-paper/reexam-2026",
    "GET",
    f"{API_BASE}/full-paper/reexam-2026",
    check_data=lambda d: True if "questions" in d and len(d["questions"]) == 180 else f"Expected 180 questions, got {len(d.get('questions', []))}"
)

# Check for image/latex fields
if full_paper_data and "questions" in full_paper_data:
    sample_q = full_paper_data["questions"][0]
    has_image_fields = any(k in sample_q for k in ["question_image", "option_images", "solution_image"])
    has_latex_fields = any(k in sample_q for k in ["question_latex", "options_latex", "solution_latex"])
    if has_image_fields or has_latex_fields:
        print(f"   ✓ Questions contain image/latex mode fields")
    else:
        print(f"   ⚠️  Warning: Questions may not have image/latex fields")
print()

# Test 8: Get chapter bank (motion in a straight line)
print("8️⃣  Testing chapter bank endpoint (neet-physics-motion-in-a-straight-line)...")
chapter_bank_1 = test_endpoint(
    "GET /api/chapter-bank/neet-physics-motion-in-a-straight-line",
    "GET",
    f"{API_BASE}/chapter-bank/neet-physics-motion-in-a-straight-line",
    check_data=lambda d: True if "total_questions" in d and d["total_questions"] >= 60 else f"Expected ~63 questions, got {d.get('total_questions', 0)}"
)
print()

# Test 9: Get chapter bank (units and measurements)
print("9️⃣  Testing chapter bank endpoint (neet-physics-units-and-measurements)...")
chapter_bank_2 = test_endpoint(
    "GET /api/chapter-bank/neet-physics-units-and-measurements",
    "GET",
    f"{API_BASE}/chapter-bank/neet-physics-units-and-measurements",
    check_data=lambda d: True if "total_questions" in d and d["total_questions"] >= 40 else f"Expected ~42 questions, got {d.get('total_questions', 0)}"
)
print()

# Test 10: Get chapter image
print("🔟 Testing chapter image endpoint...")
# Try to find a valid image filename from full paper or chapter bank
image_filename = None
if full_paper_data and "questions" in full_paper_data:
    for q in full_paper_data["questions"][:10]:  # Check first 10 questions
        if "question_image" in q and q["question_image"]:
            image_filename = q["question_image"]
            break
        if "option_images" in q and q["option_images"]:
            for opt_img in q["option_images"].values():
                if opt_img:
                    image_filename = opt_img
                    break
        if image_filename:
            break

if image_filename:
    test_endpoint(
        f"GET /api/chapter-image/{image_filename}",
        "GET",
        f"{API_BASE}/chapter-image/{image_filename}"
    )
else:
    print("⚠️  Could not find a valid image filename to test")
    tests_failed += 1
print()

# Test 11: Submit quiz
print("1️⃣1️⃣  Testing quiz submission endpoint...")
if quiz_data and "questions" in quiz_data:
    # Create a sample submission with some answers
    sample_answers = {}
    for i, q in enumerate(quiz_data["questions"][:10]):  # Answer first 10 questions
        sample_answers[q["id"]] = i % 4  # Cycle through options 0-3
    
    submission_result = test_endpoint(
        "POST /api/quiz/reexam-2026/submit",
        "POST",
        f"{API_BASE}/quiz/reexam-2026/submit",
        json_data={"answers": sample_answers},
        check_data=lambda d: True if "score" in d and "correct" in d and "wrong" in d else "Invalid submission result"
    )
else:
    print("⚠️  Skipping quiz submission test (no quiz data)")
    tests_failed += 1
print()

# Test 12: Get questions list
print("1️⃣2️⃣  Testing questions list endpoint...")
test_endpoint(
    "GET /api/questions?subject=physics",
    "GET",
    f"{API_BASE}/questions?subject=physics",
    check_data=lambda d: True if isinstance(d, list) else "Expected list of questions"
)
print()

# Test 13: Get question counts
print("1️⃣3️⃣  Testing question counts endpoint...")
test_endpoint(
    "GET /api/questions/counts?subject=physics",
    "GET",
    f"{API_BASE}/questions/counts?subject=physics",
    check_data=lambda d: True if isinstance(d, dict) else "Expected counts dictionary"
)
print()

# Summary
print("=" * 70)
print("TEST SUMMARY")
print("=" * 70)
print(f"✅ Passed: {tests_passed}")
print(f"❌ Failed: {tests_failed}")
print(f"📊 Total:  {tests_passed + tests_failed}")
print()

if tests_failed > 0:
    print("Failed tests:")
    for detail in test_details:
        if detail["status"] == "FAILED":
            reason = detail.get("reason", "Unknown")
            print(f"  - {detail['name']}: {reason}")
    print()
    sys.exit(1)
else:
    print("🎉 All tests passed!")
    sys.exit(0)
