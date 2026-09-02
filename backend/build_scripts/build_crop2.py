"""Rebuild RE-NEET 2026 to Motion 'image' format:
question_image (stem only) + option_images{a,b,c,d} (label whited-out) + solution_image.
Best-effort auto-split of the 2x2 (or single-column) option layout.
Env TEST_QNOS="1,4,5,46,91" -> only those (saves crops with _TEST suffix, no JSON write).
"""
import fitz, json, re, os, time
from PIL import Image, ImageDraw
import numpy as np

ZOOM = 2.5
PDF = "/app/backend/build_scripts/reexam2026.pdf"
IMG_DIR = "/app/backend/chapter_images"
CACHE = "/app/backend/build_scripts/ocr_cache.json"
OUT_JSON = "/app/backend/reexam_solutions.json"

BODY_TOP, BODY_BOTTOM = 250, 1838
CROP_XL, CROP_XR = 118, 1445
# 2x2 grid geometry (page px at 2.5x)
LEFT_XR = 735          # left column right edge
RIGHT_XL = 748         # right column left edge
LABEL_L_END = 262      # whiteout label region end for left/single column
LABEL_R_END = 814      # whiteout label region end for right column

doc = fitz.open(PDF)
cache = json.load(open(CACHE))
_img = {}

def page_img(i):
    if i not in _img:
        pix = doc[i].get_pixmap(matrix=fitz.Matrix(ZOOM, ZOOM))
        _img[i] = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
    return _img[i]

# question tops via left-margin ink
def detect_tops(i):
    img = page_img(i)
    strip = np.array(img.crop((132, 0, 200, img.size[1])).convert("L"))
    dark = (strip < 140).sum(axis=1)
    rows = np.where(dark >= 4)[0]
    bands = []
    if len(rows):
        s = prev = rows[0]
        for r in rows[1:]:
            if r - prev > 15:
                bands.append(int(s)); s = r
            prev = r
        bands.append(int(s))
    return [b for b in bands if 250 <= b <= 1850]

tops = []
for i in range(1, doc.page_count):
    for b in detect_tops(i):
        tops.append((i, b))

answers = []
for p in cache["pages"]:
    for ln in p["lines"]:
        if ln["first"].lower().startswith("answer") and re.search(r"answer\s*\(", ln["text"], re.I):
            m = re.search(r"\(\s*([1-4])\s*\)", ln["text"])
            answers.append((p["page"], ln["y0"], "abcd"[int(m.group(1)) - 1] if m else None))
answers.sort(key=lambda a: (a[0], a[1]))

def pos(pg, y): return pg * 100000 + y

def region_lines(p_s, y_s, p_e, y_e):
    lo, hi = pos(p_s, y_s), pos(p_e, y_e)
    out = []
    for p in cache["pages"]:
        if p["page"] < p_s or p["page"] > p_e:
            continue
        for ln in p["lines"]:
            if lo <= pos(p["page"], ln["y0"]) < hi:
                out.append({"page": p["page"], **ln})
    return out

def trim(canvas):
    gray = np.array(canvas.convert("L"))
    mask = gray < 235
    ys, xs = np.where(mask)
    if len(ys) == 0:
        return None
    pad = 8
    return canvas.crop((max(0, xs.min() - pad), max(0, ys.min() - pad),
                        min(canvas.width, xs.max() + pad), min(canvas.height, ys.max() + pad)))

def crop_stack(p_s, y_s, p_e, y_e, x0=CROP_XL, x1=CROP_XR):
    """Vertical crop, stacking across pages, within x[x0,x1]."""
    if y_e - y_s < 6 and p_s == p_e:
        return None
    slices = []
    if p_s == p_e:
        slices.append(page_img(p_s).crop((x0, max(0, y_s), x1, y_e)))
    else:
        slices.append(page_img(p_s).crop((x0, max(0, y_s), x1, BODY_BOTTOM)))
        for pp in range(p_s + 1, p_e):
            slices.append(page_img(pp).crop((x0, BODY_TOP, x1, BODY_BOTTOM)))
        slices.append(page_img(p_e).crop((x0, BODY_TOP, x1, y_e)))
    w = max(s.width for s in slices); h = sum(s.height for s in slices)
    canvas = Image.new("RGB", (w, h), (255, 255, 255))
    yo = 0
    for s in slices:
        canvas.paste(s, (0, yo)); yo += s.height
    return trim(canvas)

def crop_opt(page, y0, y1, x0, x1, label_end):
    """Single-page option cell; white out the (N) label then trim."""
    img = page_img(page).crop((x0, y0, x1, y1)).copy()
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, max(0, label_end - x0), img.height], fill=(255, 255, 255))
    return trim(img)

def detect_options(lines):
    """Return ('grid', row1_y, row2_y) or ('col', [y1,y2,y3,y4]) or (None,)."""
    mk = []
    for ln in lines:
        m = re.match(r"^\(([1-4])\)", ln["first"]) or re.match(r"^\(([1-4])\)", ln["text"])
        if m and ln["x0"] < 340:
            two = len(re.findall(r"\(([1-4])\)", ln["text"])) >= 2
            mk.append((ln["page"], ln["y0"], int(m.group(1)), two))
    if not mk:
        return (None,)
    digits = [m[2] for m in mk]
    # grid: rows contain 2 markers, or we see (1) and (3) as line-starts
    if any(m[3] for m in mk) or (1 in digits and 3 in digits and 2 not in [d for p, y, d, t in mk if not t]):
        r1 = next((m for m in mk if m[2] == 1), None)
        r3 = next((m for m in mk if m[2] == 3), None)
        if r1 and r3:
            return ("grid", r1, r3)
    if digits[:4] == [1, 2, 3, 4] and len(mk) >= 4:
        return ("col", mk[:4])
    # fallback grid using first two marker lines
    if len(mk) >= 2:
        return ("grid", mk[0], mk[1])
    return (None,)

def subject_of(n):
    return "Physics" if n <= 45 else ("Chemistry" if n <= 90 else "Biology")

test = os.environ.get("TEST_QNOS")
test_set = set(int(x) for x in test.split(",")) if test else None
suffix = "_TEST" if test else ""

questions = []
noopt = []
t0 = time.time()
N = len(tops)
for k in range(N):
    qno = k + 1
    if test_set and qno not in test_set:
        continue
    p_s, y_s = tops[k]
    p_e, y_e = tops[k + 1] if k + 1 < N else (doc.page_count - 1, BODY_BOTTOM)
    lo, hi = pos(p_s, y_s), pos(p_e, y_e)
    a = next((aa for aa in answers if lo <= pos(aa[0], aa[1]) < hi), None)
    ans_letter = a[2] if a else None
    ap, ay = (a[0], a[1]) if a else (p_e, y_e)
    qlines = region_lines(p_s, y_s, ap, ay)
    layout = detect_options(qlines)

    entry = {"question_no": qno, "subject": subject_of(qno), "year": "NEET 2026", "answer": ans_letter}
    prefix = f"reexam2026_q{qno}{suffix}"

    def save(img, name):
        if img:
            img.save(f"{IMG_DIR}/{prefix}_{name}.png")
            return f"{prefix}_{name}.png"
        return None

    if layout[0] == "grid":
        _, r1, r3 = layout
        stem = crop_stack(p_s, y_s - 8, r1[0], r1[1] - 6)
        row_split = (r1[1] + r3[1]) // 2
        oa = crop_opt(r1[0], r1[1] - 4, row_split, CROP_XL, LEFT_XR, LABEL_L_END)
        ob = crop_opt(r1[0], r1[1] - 4, row_split, RIGHT_XL, CROP_XR, LABEL_R_END)
        oc = crop_opt(r3[0], r3[1] - 4, ay - 6, CROP_XL, LEFT_XR, LABEL_L_END)
        od = crop_opt(r3[0], r3[1] - 4, ay - 6, RIGHT_XL, CROP_XR, LABEL_R_END)
        entry["question_image"] = save(stem, "question")
        entry["option_images"] = {"a": save(oa, "opt_a"), "b": save(ob, "opt_b"),
                                  "c": save(oc, "opt_c"), "d": save(od, "opt_d")}
    elif layout[0] == "col":
        ys = [m[1] for m in layout[1]]
        pg = layout[1][0][0]
        stem = crop_stack(p_s, y_s - 8, pg, ys[0] - 6)
        bounds = ys + [ay]
        letters = ["a", "b", "c", "d"]
        opts = {}
        for i in range(4):
            oi = crop_opt(pg, bounds[i] - 4, bounds[i + 1] - 4, CROP_XL, CROP_XR, LABEL_L_END)
            opts[letters[i]] = save(oi, f"opt_{letters[i]}")
        entry["question_image"] = save(stem, "question")
        entry["option_images"] = opts
    else:
        noopt.append(qno)
        whole = crop_stack(p_s, y_s - 8, ap, ay - 6)
        entry["question_image"] = save(whole, "question")
        entry["option_images"] = {}

    sol = crop_stack(ap, ay - 4, p_e, y_e - 6)
    entry["solution_image"] = save(sol, "solution")
    questions.append(entry)
    if qno % 30 == 0:
        print(f"  q{qno} ({time.time()-t0:.0f}s)", flush=True)

print("questions with NO option split (fallback):", noopt, flush=True)
if not test:
    bank = {"id": "reexam-2026", "title": "RE-NEET 2026 — Full Paper with Solutions",
            "exam": "NEET", "source": "NEET (UG) 2026 Re-Examination", "mode": "image",
            "subjects": ["Physics", "Chemistry", "Biology"], "total_questions": len(questions),
            "questions": questions}
    json.dump(bank, open(OUT_JSON, "w"))
    print(f"WROTE {OUT_JSON} with {len(questions)} questions", flush=True)
print(f"DONE ({time.time()-t0:.0f}s)")
