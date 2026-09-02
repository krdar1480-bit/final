"""Build RE-NEET 2026 Full-Paper-with-Solutions image bank.
- Question tops via left-margin ink detection (OCR-independent, exactly 180).
- Answer letter + stem/solution split via OCR 'Answer (N)' anchors.
Outputs cropped PNGs to /app/backend/chapter_images/ and reexam_solutions.json.
"""
import fitz, json, re, time
from PIL import Image
import numpy as np

ZOOM = 2.5
PDF = "/app/backend/build_scripts/reexam2026.pdf"
OUT_IMG = "/app/backend/chapter_images"
OUT_JSON = "/app/backend/reexam_solutions.json"
CACHE = "/app/backend/build_scripts/ocr_cache.json"

XL_STRIP, XR_STRIP = 132, 200      # left-margin strip (question numbers only)
INK, MIN_DARK, GAP = 140, 4, 15
BODY_TOP, BODY_BOTTOM = 250, 1838
CROP_XL, CROP_XR = 118, 1445       # horizontal crop band (full content width)

doc = fitz.open(PDF)
PAGE_H = None
_img_cache = {}

def page_img(i):
    if i not in _img_cache:
        pix = doc[i].get_pixmap(matrix=fitz.Matrix(ZOOM, ZOOM))
        _img_cache[i] = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
    return _img_cache[i]

def detect_tops(i):
    img = page_img(i)
    W, H = img.size
    strip = np.array(img.crop((XL_STRIP, 0, XR_STRIP, H)).convert("L"))
    dark = (strip < INK).sum(axis=1)
    rows = np.where(dark >= MIN_DARK)[0]
    bands = []
    if len(rows):
        s = prev = rows[0]
        for r in rows[1:]:
            if r - prev > GAP:
                bands.append(int(s)); s = r
            prev = r
        bands.append(int(s))
    return [b for b in bands if BODY_TOP <= b <= 1850], W, H

# ---- 1. Collect 180 question tops in global order ----
tops = []
for i in range(1, doc.page_count):
    bs, W, H = detect_tops(i)
    for b in bs:
        tops.append((i, b))
print("Detected question tops:", len(tops), flush=True)

# ---- 2. Answer anchors from OCR cache ----
cache = json.load(open(CACHE))
answers = []  # (page, y, letter_or_None)
for p in cache["pages"]:
    for ln in p["lines"]:
        if ln["first"].lower().startswith("answer") and re.search(r"answer\s*\(", ln["text"], re.I):
            m = re.search(r"\(\s*([1-4])\s*\)", ln["text"])
            letter = "abcd"[int(m.group(1)) - 1] if m else None
            answers.append((p["page"], ln["y0"], letter, ln["text"]))
answers.sort(key=lambda a: (a[0], a[1]))
print("Answer anchors:", len(answers), flush=True)

def pos(page, y):
    return page * 100000 + y

# ---- 3. Cross-page vertical crop + whitespace trim ----
def crop_region(p_s, y_s, p_e, y_e):
    """Crop from (p_s,y_s) to (p_e,y_e), stacking across pages. Returns PIL image or None."""
    slices = []
    if p_s == p_e:
        if y_e - y_s < 8:
            return None
        slices.append(page_img(p_s).crop((CROP_XL, max(0, y_s), CROP_XR, y_e)))
    else:
        slices.append(page_img(p_s).crop((CROP_XL, max(0, y_s), CROP_XR, BODY_BOTTOM)))
        for pp in range(p_s + 1, p_e):
            slices.append(page_img(pp).crop((CROP_XL, BODY_TOP, CROP_XR, BODY_BOTTOM)))
        slices.append(page_img(p_e).crop((CROP_XL, BODY_TOP, CROP_XR, y_e)))
    w = max(s.width for s in slices)
    h = sum(s.height for s in slices)
    canvas = Image.new("RGB", (w, h), (255, 255, 255))
    yo = 0
    for s in slices:
        canvas.paste(s, (0, yo)); yo += s.height
    # trim surrounding whitespace
    gray = np.array(canvas.convert("L"))
    mask = gray < 235
    ys, xs = np.where(mask)
    if len(ys) == 0:
        return None
    pad = 10
    x0 = max(0, xs.min() - pad); x1 = min(canvas.width, xs.max() + pad)
    y0 = max(0, ys.min() - pad); y1 = min(canvas.height, ys.max() + pad)
    return canvas.crop((x0, y0, x1, y1))

def subject_of(n):
    if n <= 45: return "Physics"
    if n <= 90: return "Chemistry"
    return "Biology"

# ---- 4. Build per-question ----
questions = []
missing_ans = []
t0 = time.time()
N = len(tops)
for k in range(N):
    qno = k + 1
    p_s, y_s = tops[k]
    if k + 1 < N:
        p_e, y_e = tops[k + 1]
    else:
        p_e, y_e = doc.page_count - 1, BODY_BOTTOM
    # find answer anchor within [top_k, top_{k+1})
    lo, hi = pos(p_s, y_s), pos(p_e, y_e)
    a = next((aa for aa in answers if lo <= pos(aa[0], aa[1]) < hi), None)
    entry = {"question_no": qno, "subject": subject_of(qno), "year": "NEET 2026"}
    if a:
        ap, ay, letter, _ = a
        entry["answer"] = letter  # may be None for bonus/no-option
        stem = crop_region(p_s, y_s - 8, ap, ay - 6)
        sol = crop_region(ap, ay - 4, p_e, y_e - 6)
    else:
        missing_ans.append(qno)
        entry["answer"] = None
        stem = crop_region(p_s, y_s - 8, p_e, y_e - 6)
        sol = None
    if stem:
        fn = f"reexam2026_q{qno}_q.png"; stem.save(f"{OUT_IMG}/{fn}"); entry["question_image"] = fn
    if sol:
        fn = f"reexam2026_q{qno}_s.png"; sol.save(f"{OUT_IMG}/{fn}"); entry["solution_image"] = fn
    questions.append(entry)
    if qno % 30 == 0:
        print(f"  built {qno}/{N} ({time.time()-t0:.0f}s)", flush=True)

bank = {
    "id": "reexam-2026",
    "title": "RE-NEET 2026 — Full Paper with Solutions",
    "exam": "NEET",
    "source": "NEET (UG) 2026 Re-Examination",
    "mode": "image",
    "subjects": ["Physics", "Chemistry", "Biology"],
    "total_questions": len(questions),
    "questions": questions,
}
json.dump(bank, open(OUT_JSON, "w"))
print("Missing answer anchors for Q:", missing_ans, flush=True)
print(f"DONE {len(questions)} questions, images in {OUT_IMG}, json {OUT_JSON} ({time.time()-t0:.0f}s)")
