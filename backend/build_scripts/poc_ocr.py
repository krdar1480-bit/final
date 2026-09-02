"""POC: inspect OCR anchors on first few pages to calibrate detection."""
import fitz, pytesseract, re
from PIL import Image

ZOOM = 2.5
doc = fitz.open("/app/backend/build_scripts/reexam2026.pdf")

def page_image(i):
    pix = doc[i].get_pixmap(matrix=fitz.Matrix(ZOOM, ZOOM))
    return Image.frombytes("RGB", [pix.width, pix.height], pix.samples), pix.width, pix.height

for i in [1, 2, 3]:
    img, W, H = page_image(i)
    data = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT)
    print(f"\n===== PAGE {i} (W={W} H={H}) =====")
    n = len(data["text"])
    # Reconstruct lines: group by (block,par,line)
    lines = {}
    for j in range(n):
        t = data["text"][j].strip()
        if not t:
            continue
        key = (data["block_num"][j], data["par_num"][j], data["line_num"][j])
        lines.setdefault(key, []).append((data["left"][j], data["top"][j], data["width"][j], data["height"][j], t))
    for key in sorted(lines.keys()):
        toks = sorted(lines[key], key=lambda x: x[0])
        first = toks[0]
        text = " ".join(w[4] for w in toks)
        fx, fy = first[0], first[1]
        tag = ""
        if re.match(r"^\d{1,3}\.$", first[4]) and fx < 0.10 * W:
            tag = " <QSTART?>"
        if first[4].lower().startswith("answer"):
            tag = " <ANSWER?>"
        if first[4].lower().startswith("sol"):
            tag = " <SOL?>"
        if text.strip() in ("PHYSICS", "CHEMISTRY", "BOTANY", "ZOOLOGY", "BIOLOGY"):
            tag = " <SUBJECT?>"
        if tag:
            print(f"  x={fx:4d} y={fy:4d} | {text[:70]!r}{tag}")
