"""Compute recall of expected question numbers 1..180 among left-margin candidates."""
import json, re
c = json.load(open("/app/backend/build_scripts/ocr_cache.json"))
G = []
for p in c["pages"]:
    for ln in p["lines"]:
        G.append({**ln, "page": p["page"], "W": p["W"], "H": p["H"]})
G.sort(key=lambda g: (g["page"], g["y0"]))

def qval(g, xmax):
    if g["x"] >= xmax:
        return None
    m = re.match(r"^(\d{1,3})[.,\)]?$", g["first"])
    if m:
        return int(m.group(1))
    m2 = re.match(r"^(\d{1,3})[.\)]\s+\S", g["text"])
    if m2:
        return int(m2.group(1))
    return None

for XMAX in (185, 200, 230):
    # walk expected 1..180 in order
    found = {}
    cursor = 0
    for e in range(1, 181):
        for i in range(cursor, len(G)):
            v = qval(G[i], XMAX)
            if v == e:
                found[e] = (G[i]["page"], G[i]["y0"], G[i]["x"])
                cursor = i + 1
                break
    missing = [e for e in range(1, 181) if e not in found]
    print(f"XMAX={XMAX}: found {len(found)}/180, missing={missing}")
