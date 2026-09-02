"""Detect question-number rows via ink in the far-left margin strip (OCR-independent)."""
import fitz
from PIL import Image
import numpy as np

ZOOM = 2.5
doc = fitz.open("/app/backend/build_scripts/reexam2026.pdf")
XL, XR = 132, 200      # left-margin strip where only question numbers live
INK = 140              # grayscale threshold for ink
MIN_DARK = 4           # min dark pixels in a row to count as ink
GAP = 15               # rows gap to separate bands

def page_img(i):
    pix = doc[i].get_pixmap(matrix=fitz.Matrix(ZOOM, ZOOM))
    return Image.frombytes("RGB", [pix.width, pix.height], pix.samples)

def bands(i):
    img = page_img(i)
    W, H = img.size
    strip = np.array(img.crop((XL, 0, XR, H)).convert("L"))
    dark = (strip < INK).sum(axis=1)  # dark pixel count per row
    rows = np.where(dark >= MIN_DARK)[0]
    out = []
    if len(rows):
        start = prev = rows[0]
        for r in rows[1:]:
            if r - prev > GAP:
                out.append((int(start), int(prev)))
                start = r
            prev = r
        out.append((int(start), int(prev)))
    # keep bands only in body region (exclude very top header area y<230 and footer y>1850)
    out = [b for b in out if 230 <= b[0] <= 1850]
    return out, H

total = 0
for i in [1, 2, 3, 10, 25, 46, 71]:
    b, H = bands(i)
    print(f"page {i}: {len(b)} bands tops={[x[0] for x in b]}")

# full count across content pages 1..71
total = 0
for i in range(1, doc.page_count):
    b, _ = bands(i)
    total += len(b)
print("TOTAL bands (pages 1..71):", total)
