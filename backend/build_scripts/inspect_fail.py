import re, json
for q in [32, 39, 50]:
    try:
        t = open(f"/tmp/latex_fail_q{q}.txt").read()
    except FileNotFoundError:
        print(q, "no file"); continue
    m = re.search(r"\{.*\}", t, re.S)
    s = m.group(0) if m else t
    try:
        json.loads(s)
        print(q, "raw parses fine (unexpected)")
        continue
    except json.JSONDecodeError as e:
        pos = e.pos
        print(f"Q{q} raw error @ {pos}: ...{s[max(0,pos-30):pos+20]!r}...")
    fixed = re.sub(r'\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})', r'\\\\', s)
    try:
        json.loads(fixed)
        print(f"   -> sanitizer FIXES it")
    except json.JSONDecodeError as e:
        pos = e.pos
        print(f"   -> still fails @ {pos}: ...{fixed[max(0,pos-30):pos+20]!r}...")
