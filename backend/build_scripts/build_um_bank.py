import glob, os, sys, json, hashlib
sys.path.insert(0, "/app/backend/build_scripts")
import build_um as B

SRC = "/tmp/um_upload"
IMG_DIR = "/app/backend/chapter_images"
BANK = "/app/backend/chapter_banks/neet-physics-units-and-measurements.json"

files = sorted(glob.glob(f"{SRC}/*.jpg"))

# de-duplicate identical images by content hash
seen = {}
uniq = []
for f in files:
    h = hashlib.md5(open(f, "rb").read()).hexdigest()
    if h in seen:
        print("dup skip:", os.path.basename(f), "==", os.path.basename(seen[h]))
        continue
    seen[h] = f
    uniq.append(f)

# clear previous um_ images
for old in glob.glob(f"{IMG_DIR}/um_q*.png"):
    os.remove(old)

questions = []
qno = 0
LIMIT = int(os.environ.get("UM_LIMIT", "5"))   # sample: first 5 only
for f in uniq:
    base = os.path.basename(f)
    res = B.analyze(f, "tmp", "/tmp/um_stage", save=False)
    if res is None:
        continue
    qno += 1
    prefix = f"um_q{qno}"
    B.analyze(f, prefix, IMG_DIR, save=True)
    q = {
        "question_no": qno,
        "year": res.get("year", "NEET"),
        "answer": res["answer"],
        "question_image": f"{prefix}_question.png",
        "option_images": {L: f"{prefix}_opt_{L}.png" for L in "abcd"},
        "solution_image": f"{prefix}_solution.png",
    }
    questions.append(q)
    if qno >= LIMIT:
        break

bank = {
    "key": "neet-physics-units-and-measurements",
    "exam": "NEET",
    "subject": "physics",
    "cls": "11",
    "chapter_no": 1,
    "chapter": "Units and Measurements",
    "source": "NEET",
    "mode": "image",
    "total_questions": len(questions),
    "sections": [
        {"topic": "NEET — Units and Measurements", "questions": questions}
    ],
}
json.dump(bank, open(BANK, "w"), ensure_ascii=False, indent=2)
print(f"\nWrote {len(questions)} questions to {BANK}")
print("answers:", "".join((q["answer"] or "?") for q in questions))
# sanity: verify all referenced images exist
missing = 0
for q in questions:
    for name in [q["question_image"], q["solution_image"], *q["option_images"].values()]:
        if not os.path.exists(f"{IMG_DIR}/{name}"):
            missing += 1; print("MISSING", name)
print("missing images:", missing)
