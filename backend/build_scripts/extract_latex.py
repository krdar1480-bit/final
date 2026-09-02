"""Convert RE-NEET 2026 question+solution crops to LaTeX using a vision LLM.
Writes incrementally to reexam_latex.json (idempotent, resumable).
Env:
  TEST_QNOS="1,46,91"   -> only process these question numbers (validation)
"""
import os, json, base64, asyncio, re, time
from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

load_dotenv("/app/backend/.env")
KEY = os.environ.get("EMERGENT_LLM_KEY")
IMG_DIR = "/app/backend/chapter_images"
MAIN = "/app/backend/reexam_solutions.json"
OUT = "/app/backend/reexam_latex.json"
MODEL = ("openai", "gpt-5.4")
CONCURRENCY = 5

PROMPT = (
    "You are transcribing an exam MCQ (Physics/Chemistry/Biology) into LaTeX for a study app. "
    "You are given TWO images: the FIRST image is the QUESTION (stem + four options); "
    "the SECOND image is the ANSWER & SOLUTION.\n"
    "Output MUST use EXACTLY these delimiter markers, each on its own line, in this order, and "
    "put the content on the lines AFTER each marker (do NOT use JSON, do NOT escape backslashes):\n"
    "###QUESTION###\n(question stem latex)\n"
    "###OPTA###\n(option 1 latex)\n"
    "###OPTB###\n(option 2 latex)\n"
    "###OPTC###\n(option 3 latex)\n"
    "###OPTD###\n(option 4 latex)\n"
    "###QDIAG###\n(true or false)\n"
    "###EXPLANATION###\n(solution latex)\n"
    "###SDIAG###\n(true or false)\n"
    "Rules:\n"
    "- Transcribe EXACTLY. Wrap every math expression in $...$ using normal LaTeX "
    "(\\frac, ^, _, \\sqrt, \\vec, \\hat, \\alpha, units like $\\text{m s}^{-1}$). Write backslashes normally.\n"
    "- Options must contain ONLY the option content (no (1)/(2)/A./B. labels). "
    "If fewer than 4 options exist, leave that option's content blank.\n"
    "- Linearize simple tables (e.g. Match List-I with List-II) into readable text.\n"
    "- QDIAG=true ONLY if the QUESTION has an essential figure/graph/circuit/geometry/structure drawing "
    "that cannot be faithfully written as text/LaTeX; otherwise false. Same idea for SDIAG on the SOLUTION.\n"
    "- Even when a diagram is present, still fill the text fields with best effort.\n"
    "- Do NOT include 'Answer (n)' in the explanation; just the worked solution."
)

def b64(path):
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode()

_MARKERS = ["###QUESTION###", "###OPTA###", "###OPTB###", "###OPTC###",
            "###OPTD###", "###QDIAG###", "###EXPLANATION###", "###SDIAG###"]

def parse_markers(text):
    # Find each marker position, slice content between markers.
    idx = {}
    for mk in _MARKERS:
        p = text.find(mk)
        if p < 0:
            raise ValueError(f"missing marker {mk}")
        idx[mk] = p
    order = sorted(_MARKERS, key=lambda m: idx[m])
    vals = {}
    for i, mk in enumerate(order):
        start = idx[mk] + len(mk)
        end = idx[order[i + 1]] if i + 1 < len(order) else len(text)
        vals[mk] = text[start:end].strip()
    def tf(v):
        return v.strip().lower().startswith("true")
    return {
        "question_latex": vals["###QUESTION###"],
        "options_latex": {"a": vals["###OPTA###"], "b": vals["###OPTB###"],
                          "c": vals["###OPTC###"], "d": vals["###OPTD###"]},
        "question_has_diagram": tf(vals["###QDIAG###"]),
        "explanation_latex": vals["###EXPLANATION###"],
        "solution_has_diagram": tf(vals["###SDIAG###"]),
    }

async def process(q, sem, results):
    qno = q["question_no"]
    async with sem:
        try:
            imgs = []
            if q.get("question_image"):
                imgs.append(ImageContent(image_base64=b64(f"{IMG_DIR}/{q['question_image']}")))
            if q.get("solution_image"):
                imgs.append(ImageContent(image_base64=b64(f"{IMG_DIR}/{q['solution_image']}")))
            chat = LlmChat(api_key=KEY, session_id=f"latex-q{qno}",
                           system_message="You output only strict JSON.").with_model(*MODEL)
            resp = await chat.send_message(UserMessage(text=PROMPT, file_contents=imgs))
            data = parse_markers(resp if isinstance(resp, str) else str(resp))
            results[str(qno)] = {
                "question_latex": data.get("question_latex", ""),
                "options_latex": data.get("options_latex", {}) or {},
                "question_has_diagram": bool(data.get("question_has_diagram", False)),
                "explanation_latex": data.get("explanation_latex", ""),
                "solution_has_diagram": bool(data.get("solution_has_diagram", False)),
            }
            # checkpoint after each success
            json.dump(results, open(OUT, "w"))
            print(f"  OK q{qno} (diagram q={results[str(qno)]['question_has_diagram']} "
                  f"s={results[str(qno)]['solution_has_diagram']})", flush=True)
        except Exception as e:
            try:
                with open(f"/tmp/latex_fail_q{qno}.txt", "w") as fh:
                    fh.write(resp if isinstance(resp, str) else str(resp))
            except Exception:
                pass
            print(f"  FAIL q{qno}: {repr(e)[:160]}", flush=True)

async def main():
    bank = json.load(open(MAIN))
    qs = bank["questions"]
    results = {}
    if os.path.exists(OUT):
        try:
            results = json.load(open(OUT))
        except Exception:
            results = {}
    test = os.environ.get("TEST_QNOS")
    if test:
        want = set(int(x) for x in test.split(","))
        qs = [q for q in qs if q["question_no"] in want]
    else:
        qs = [q for q in qs if str(q["question_no"]) not in results]
    print(f"Processing {len(qs)} questions (already done: {len(results)})", flush=True)
    sem = asyncio.Semaphore(CONCURRENCY)
    t0 = time.time()
    await asyncio.gather(*[process(q, sem, results) for q in qs])
    print(f"DONE. total in file: {len(results)} ({time.time()-t0:.0f}s)", flush=True)

if __name__ == "__main__":
    asyncio.run(main())
