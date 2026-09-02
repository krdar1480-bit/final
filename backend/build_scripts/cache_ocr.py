"""Cache OCR line-level data for every page (run once). Slow (~2-3 min)."""
import fitz, pytesseract, json, time
from PIL import Image

ZOOM = 2.5
doc = fitz.open("/app/backend/build_scripts/reexam2026.pdf")
out = {"zoom": ZOOM, "pages": []}
t0 = time.time()
for i in range(doc.page_count):
    pix = doc[i].get_pixmap(matrix=fitz.Matrix(ZOOM, ZOOM))
    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
    data = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT)
    n = len(data["text"])
    lines = {}
    for j in range(n):
        t = data["text"][j].strip()
        if not t:
            continue
        key = (data["block_num"][j], data["par_num"][j], data["line_num"][j])
        lines.setdefault(key, []).append([data["left"][j], data["top"][j], data["width"][j], data["height"][j], t])
    page_lines = []
    for key in sorted(lines.keys()):
        toks = sorted(lines[key], key=lambda x: x[0])
        x0 = min(w[0] for w in toks)
        y0 = min(w[1] for w in toks)
        x1 = max(w[0] + w[2] for w in toks)
        y1 = max(w[1] + w[3] for w in toks)
        text = " ".join(w[4] for w in toks)
        first = toks[0]
        page_lines.append({"x": first[0], "y": first[1], "x0": x0, "y0": y0, "x1": x1, "y1": y1,
                           "first": first[4], "text": text})
    out["pages"].append({"page": i, "W": pix.width, "H": pix.height, "lines": page_lines})
    if i % 10 == 0:
        print(f"  page {i} done ({time.time()-t0:.0f}s)", flush=True)

json.dump(out, open("/app/backend/build_scripts/ocr_cache.json", "w"))
print(f"DONE {doc.page_count} pages in {time.time()-t0:.0f}s -> ocr_cache.json")
