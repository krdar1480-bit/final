import glob, os, sys
sys.path.insert(0, "/app/backend/build_scripts")
import build_um as B

files = sorted(glob.glob("/tmp/um_upload/*.jpg"))
staging = "/tmp/um_stage"
os.makedirs(staging, exist_ok=True)
os.system(f"rm -f {staging}/*")

valid = 0
skipped = []
for f in files:
    base = os.path.basename(f)
    try:
        res = B.analyze(f, f"probe", staging, save=False)
    except Exception as e:
        res = None
        print("ERR", base, e)
    if res is None:
        skipped.append(base)
        continue
    valid += 1
    print(f"OK  {base[:45]:45s} nopts={res['nopts']} answer={res['answer']}")

print("\n=== VALID questions:", valid, " SKIPPED:", len(skipped))
for s in skipped:
    print("  skip:", s)
