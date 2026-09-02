"""Inspect option-marker OCR tokens in the question region of a few questions."""
import fitz, json, re
from PIL import Image
import numpy as np

ZOOM = 2.5
doc = fitz.open("/app/backend/build_scripts/reexam2026.pdf")
cache = json.load(open("/app/backend/build_scripts/ocr_cache.json"))

# recompute question tops via left-margin ink
XL_STRIP, XR_STRIP, INK, MIN_DARK, GAP = 132, 200, 140, 4, 15
def detect_tops(i):
    pix = doc[i].get_pixmap(matrix=fitz.Matrix(ZOOM, ZOOM))
    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
    strip = np.array(img.crop((XL_STRIP, 0, XR_STRIP, img.size[1])).convert("L"))
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
    return [b for b in bands if 250 <= b <= 1850], img.size[0]

tops = []
for i in range(1, doc.page_count):
    bs, W = detect_tops(i)
    for b in bs:
        tops.append((i, b))

# answer anchors
answers = []
for p in cache["pages"]:
    for ln in p["lines"]:
        if ln["first"].lower().startswith("answer") and re.search(r"answer\s*\(", ln["text"], re.I):
            answers.append((p["page"], ln["y0"]))
answers.sort()

def pos(pg, y): return pg * 100000 + y

for qno in [1, 4, 5, 46, 91]:
    k = qno - 1
    p_s, y_s = tops[k]
    p_e, y_e = tops[k + 1] if k + 1 < len(tops) else (doc.page_count - 1, 1838)
    lo, hi = pos(p_s, y_s), pos(p_e, y_e)
    a = next((aa for aa in answers if lo <= pos(*aa) < hi), None)
    print(f"\n=== Q{qno}: top=({p_s},{y_s}) answer={a} nextTop=({p_e},{y_e}) ===")
    # print option-marker-like tokens in [top..answer]
    ahi = pos(*a) if a else hi
    for p in cache["pages"]:
        if p["page"] < p_s or p["page"] > (a[0] if a else p_e):
            continue
        for ln in p["lines"]:
            pp = pos(p["page"], ln["y0"])
            if lo <= pp < ahi:
                if re.match(r"^\(?\s*[1-4]\s*[\)\.]", ln["first"]) or re.match(r"^\(?\s*[1-4]\s*[\)\.]", ln["text"]):
                    print(f"  p{p['page']} y={ln['y0']:4d} x0={ln['x0']:4d} first={ln['first']!r} text={ln['text'][:40]!r}")
