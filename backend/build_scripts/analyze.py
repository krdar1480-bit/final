"""Analyze cache: subject headers, Answer anchors, left-margin Q-number anchors."""
import json, re
c = json.load(open("/app/backend/build_scripts/ocr_cache.json"))
pages = c["pages"]

# Global ordered lines
G = []
for p in pages:
    for ln in p["lines"]:
        G.append({**ln, "page": p["page"], "W": p["W"], "H": p["H"]})

# Subject headers
subs = [(g["page"], g["y0"], g["text"].strip().upper().rstrip(":")) for g in G
        if g["text"].strip().upper().rstrip(":") in ("PHYSICS", "CHEMISTRY", "BIOLOGY", "BOTANY", "ZOOLOGY")]
print("SUBJECT HEADERS:", subs)

# Answer anchors
ans = [(g["page"], g["y0"], g["text"]) for g in G if g["first"].lower().startswith("answer")]
print("ANSWER anchors:", len(ans))

# Left-margin numeric anchors (x small). Determine typical x band.
xs = []
for g in G:
    if re.match(r"^\d{1,3}[.\)]?$", g["first"]) or re.match(r"^\d{1,3}\.\s+\S", g["text"]):
        xs.append(g["x"])
xs.sort()
print("num-like first-token x distribution (min,med,max):", xs[0] if xs else None,
      xs[len(xs)//2] if xs else None, xs[-1] if xs else None)

# Show left-margin numeric anchors with x < 185, in order, near each subject
qanch = []
for gi, g in enumerate(G):
    m = re.match(r"^(\d{1,3})[.\)]?$", g["first"])
    m2 = re.match(r"^(\d{1,3})\.\s+\S", g["text"])
    val = int(m.group(1)) if m else (int(m2.group(1)) if m2 else None)
    if val is not None and g["x"] < 185:
        qanch.append((g["page"], g["y0"], g["x"], val, g["text"][:35]))
print("Q-anchors (x<185):", len(qanch))
print("First 20:", [(a[3]) for a in qanch[:20]])
# around chemistry (page ~25) and biology (page ~46)
print("Near CHEM (pages 24-26):", [(a[0], a[3]) for a in qanch if 24 <= a[0] <= 26])
print("Near BIO (pages 45-47):", [(a[0], a[3]) for a in qanch if 45 <= a[0] <= 47])
