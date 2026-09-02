"""POC2: count Answer/Sol/Subject anchors across all pages, and calibrate Q-number detection."""
import fitz, pytesseract, re
from PIL import Image

ZOOM = 2.5
doc = fitz.open("/app/backend/build_scripts/reexam2026.pdf")

def page_lines(i):
    pix = doc[i].get_pixmap(matrix=fitz.Matrix(ZOOM, ZOOM))
    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
    data = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT)
    W, H = pix.width, pix.height
    n = len(data["text"])
    lines = {}
    for j in range(n):
        t = data["text"][j].strip()
        if not t:
            continue
        key = (data["block_num"][j], data["par_num"][j], data["line_num"][j])
        lines.setdefault(key, []).append((data["left"][j], data["top"][j], data["width"][j], data["height"][j], t))
    out = []
    for key in sorted(lines.keys()):
        toks = sorted(lines[key], key=lambda x: x[0])
        first = toks[0]
        text = " ".join(w[4] for w in toks)
        out.append((first[0], first[1], first[4], text))
    return out, W, H

ans = sol = subj = 0
subjects_found = []
qstarts = []
for i in range(doc.page_count):
    lines, W, H = page_lines(i)
    for fx, fy, ftok, text in lines:
        low = ftok.lower()
        if low.startswith("answer"):
            ans += 1
        if low.startswith("sol"):
            sol += 1
        st = text.strip().upper().rstrip(":")
        if st in ("PHYSICS", "CHEMISTRY", "BOTANY", "ZOOLOGY", "BIOLOGY"):
            subj += 1
            subjects_found.append((i, st))
        # candidate question number at left margin
        m = re.match(r"^(\d{1,3})[.\)]?$", ftok)
        if m and fx < 0.14 * W:
            qstarts.append((i, fx, fy, int(m.group(1)), text[:40]))
        # also number attached to text: "12. Consider..."
        m2 = re.match(r"^(\d{1,3})\.\s+\S", text)
        if m2 and fx < 0.14 * W and not m:
            qstarts.append((i, fx, fy, int(m2.group(1)), text[:40]))

print("TOTAL Answer anchors:", ans)
print("TOTAL Sol anchors:", sol)
print("Subjects found:", subjects_found)
print("Q-start candidates:", len(qstarts))
# print numeric sequence of q-starts to inspect continuity
nums = [q[3] for q in qstarts]
print("First 60 q-start numbers:", nums[:60])
