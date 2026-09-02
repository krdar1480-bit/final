"""Convert ExamGOAL mobile question screenshots -> Motion 'image' format.
Outputs per question: <id>_question.png (stem+options, answer de-highlighted),
<id>_opt_a..d.png (each option card cleaned), <id>_solution.png, plus answer letter.
Pure PIL+numpy (no OCR). Tuned to the consistent ExamGOAL mobile layout.
"""
import sys
import re
import numpy as np
from PIL import Image
try:
    import pytesseract
except Exception:
    pytesseract = None

def load(path):
    im = Image.open(path).convert("RGB")
    return im, np.asarray(im).astype(int)

def masks(a, W):
    x0, x1 = int(W*0.10), int(W*0.90)
    band = a[:, x0:x1, :]
    r, g, b = band[..., 0], band[..., 1], band[..., 2]
    pure_white = (r > 248) & (g > 248) & (b > 248)
    gray_bg = (r > 233) & (r <= 249) & (np.abs(r-g) < 7) & (np.abs(g-b) < 7) & (~pure_white)
    strong_green = (g > 150) & (g > r + 15) & (g > b + 15)
    lblue = (b > 245) & (r > 210) & (r < 244) & (g > 224) & (g < 248)
    strong_blue = (b > 150) & (b > r + 40) & (b > g + 25)
    lgreen = (g > 225) & (g > r + 4) & (g > b + 4)  # pale green banner / card bg
    return dict(w=pure_white.mean(1), gray=gray_bg.mean(1), green=strong_green.mean(1),
                lblue=lblue.mean(1), blue=strong_blue.mean(1), lgreen=lgreen.mean(1))

def bands(frac, thr, minh):
    out=[]; s=None; H=len(frac)
    for y in range(H):
        if frac[y]>=thr:
            if s is None: s=y
        else:
            if s is not None and y-s>=minh:
                out.append((s,y))
            s=None
    if s is not None and H-s>=minh:
        out.append((s,H))
    return out

def trim(imcrop):
    """trim near-white margins around a crop"""
    arr = np.asarray(imcrop.convert("RGB")).astype(int)
    nonwhite = ~((arr[...,0]>246)&(arr[...,1]>246)&(arr[...,2]>246))
    ys = np.where(nonwhite.any(1))[0]
    xs = np.where(nonwhite.any(0))[0]
    if len(ys)==0 or len(xs)==0:
        return imcrop
    pad=8
    y0=max(0,ys[0]-pad); y1=min(arr.shape[0],ys[-1]+pad)
    x0=max(0,xs[0]-pad); x1=min(arr.shape[1],xs[-1]+pad)
    return imcrop.crop((x0,y0,x1,y1))

def clean_option(imcrop, is_correct):
    """Way 2: keep the FULL original option card (badge, border, and the green
    'correct' highlight stay as-is). Just trim margins; no cleaning."""
    return trim(imcrop)

def analyze(path, out_prefix, outdir, save=True):
    im, a = load(path)
    H, W, _ = a.shape
    m = masks(a, W)
    blue_bands = bands(m["blue"], 0.6, 10)
    blue_end = blue_bands[0][1] if blue_bands else 380
    # NEET banner (pale green) right after blue nav
    lg = [bd for bd in bands(m["lgreen"], 0.5, 8) if bd[0] >= blue_end-5 and bd[0] < blue_end+180]
    q_top = lg[0][1] if lg else blue_end + 60
    # OCR the year from the green "NEET 20XX" banner
    year = "NEET"
    if pytesseract is not None:
        try:
            banner = im.crop((0, blue_end, W, q_top + 12))
            txt = pytesseract.image_to_string(banner)
            mo = re.search(r"20\d\d", txt)
            if mo:
                year = f"NEET {mo.group()}"
                if re.search(r"re[- ]?exam", txt, re.I):
                    year += " (Re-Exam)"
        except Exception:
            pass
    # explanation banner(s)
    lbb = bands(m["lblue"], 0.5, 10)
    lbb = [bd for bd in lbb if bd[0] > q_top+80]
    if not lbb:
        return None  # not a question screenshot
    expl_start = lbb[0][0]
    # solution bottom: cut off "Add a Note" (light-blue btn) / "Show Answer" toggle / nav (strong blue)
    after = expl_start + 150
    tail_lblue = [bd for bd in bands(m["lblue"], 0.08, 8) if bd[0] > after]
    tail_blue = [bd for bd in bands(m["blue"], 0.10, 8) if bd[0] > after]
    cands = [bd[0] for bd in tail_lblue] + [bd[0] for bd in tail_blue]
    sol_bottom = min(cands) - 12 if cands else H - 40
    # green correct badge (with lenient fallback)
    gbands = [bd for bd in bands(m["green"], 0.2, 6) if q_top < bd[0] < expl_start]
    if not gbands:
        gbands = [bd for bd in bands(m["green"], 0.08, 5) if q_top < bd[0] < expl_start]
    green_y = gbands[0][0] if gbands else None
    # segment cards in [q_top..expl_start] using gray gaps
    reg = slice(q_top, expl_start)
    gap = m["gray"][reg] > 0.75
    ys = np.arange(q_top, expl_start)
    blocks=[]; s=None
    for i,gp in enumerate(gap):
        if not gp:
            if s is None: s=i
        else:
            if s is not None and (i-s) > 18:
                blocks.append((ys[s], ys[i]))
            s=None
    if s is not None and (len(gap)-s) > 18:
        blocks.append((ys[s], ys[-1]))
    # first block = stem (has meta on top), next up to 4 = options
    stem = blocks[0] if blocks else (q_top, q_top+50)
    opts = blocks[1:5]
    # strip meta (question no / timer / MCQ pill) from top of stem block
    ms, me = stem
    meta_reg_end = min(me, ms + 240)
    meta_rows = [y for y in range(ms, meta_reg_end)
                 if m["blue"][y] > 0.03 or m["lblue"][y] > 0.03]
    stem_text_top = (max(meta_rows) + 12) if meta_rows else ms
    stem = (min(stem_text_top, me-20), me)
    answer = None
    if green_y is not None and opts:
        for idx,(bs,be) in enumerate(opts):
            if bs-30 <= green_y <= be+10:
                answer = "abcd"[idx]; break
        if answer is None:
            # nearest option to green_y
            idx = min(range(len(opts)), key=lambda i: abs(((opts[i][0]+opts[i][1])//2)-green_y))
            answer = "abcd"[idx]
    print(f"{out_prefix}: H={H} q_top={q_top} expl={expl_start} sol_bottom={sol_bottom} "
          f"blocks={len(blocks)} answer={answer} green_y={green_y}")
    print(f"   stem={stem} opts={opts}")
    if save:
        xpad0, xpad1 = int(W*0.02), int(W*0.98)
        # question image = STEM ONLY (Motion format)
        qimg = im.crop((xpad0, stem[0], xpad1, stem[1]))
        qimg = trim(qimg)
        qimg.save(f"{outdir}/{out_prefix}_question.png")
        # per-option crops = FULL original card (way 2); pad to keep top/bottom border + badge
        for idx,(bs,be) in enumerate(opts):
            oc = im.crop((xpad0, max(0, bs-10), xpad1, min(H, be+10)))
            oc = clean_option(oc, "abcd"[idx] == answer)
            oc = trim(oc)
            oc.save(f"{outdir}/{out_prefix}_opt_{'abcd'[idx]}.png")
        # solution
        simg = im.crop((xpad0, expl_start, xpad1, sol_bottom))
        simg = trim(simg)
        simg.save(f"{outdir}/{out_prefix}_solution.png")
    return dict(answer=answer, nopts=len(opts), year=year)

if __name__ == "__main__":
    import os
    outdir = sys.argv[2] if len(sys.argv)>2 else "/tmp/um_out"
    os.makedirs(outdir, exist_ok=True)
    analyze(sys.argv[1], "test", outdir)
