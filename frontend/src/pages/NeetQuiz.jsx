import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getQuiz, submitQuiz } from "@/lib/api";
import { Stethoscope, Clock, ChevronLeft, ChevronRight, CheckCircle2, XCircle, MinusCircle, Loader2, ArrowLeft, Award } from "lucide-react";

const SUBJECT_COLORS = {
  Physics: "text-sky-600 bg-sky-50 border-sky-200",
  Chemistry: "text-emerald-600 bg-emerald-50 border-emerald-200",
  Biology: "text-rose-600 bg-rose-50 border-rose-200",
};

function fmt(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const p = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${p(h)}:${p(m)}:${p(s)}` : `${p(m)}:${p(s)}`;
}

export default function NeetQuiz() {
  const { quizId = "reexam-2026" } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [cur, setCur] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [result, setResult] = useState(null);
  const [review, setReview] = useState(false);
  const [subFilter, setSubFilter] = useState("All");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getQuiz(quizId).then((q) => {
      setQuiz(q);
      setTimeLeft((q.duration_min || 195) * 60);
      if (q.subjects?.length) setSubFilter(q.subjects[0]);
    }).catch(() => setQuiz({ error: true }));
  }, [quizId]);

  const doSubmit = useCallback(async () => {
    if (!quiz || submitting) return;
    setSubmitting(true);
    try {
      const res = await submitQuiz(quizId, answers);
      setResult(res);
      window.scrollTo(0, 0);
    } finally {
      setSubmitting(false);
    }
  }, [quiz, quizId, answers, submitting]);

  useEffect(() => {
    if (!quiz || quiz.error || result) return;
    if (timeLeft <= 0) { doSubmit(); return; }
    const t = setInterval(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [quiz, result, timeLeft, doSubmit]);

  const questions = quiz?.questions || [];
  const subjects = quiz?.subjects || [];

  const filtered = useMemo(() => {
    if (!subFilter || subFilter === "All") return questions.map((q, i) => ({ q, i }));
    return questions.map((q, i) => ({ q, i })).filter(({ q }) => q.subject === subFilter);
  }, [questions, subFilter]);

  if (!quiz) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="h-6 w-6 animate-spin text-[#5B50E6]" />
      </div>
    );
  }
  if (quiz.error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#F8FAFC]">
        <p className="text-slate-600">Could not load this test.</p>
        <button onClick={() => navigate(-1)} className="rounded-lg bg-[#5B50E6] px-4 py-2 text-sm font-bold text-white">Go back</button>
      </div>
    );
  }

  // ---------------- RESULTS ----------------
  if (result) {
    const pct = Math.max(0, Math.round((result.score / result.total_marks) * 100));
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <header className="sticky top-0 z-40 bg-[#5B50E6]">
          <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
            <button onClick={() => navigate(`/exam/neet/papers`)} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white hover:bg-white/20">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <Stethoscope className="h-5 w-5 text-white" />
            <h1 className="text-lg font-extrabold text-white">{quiz.title} · Result</h1>
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-4 py-6">
          {!review ? (
            <>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-[#312E81]">
                  <Award className="h-7 w-7" />
                </div>
                <p className="text-sm font-semibold text-slate-500">Your Score</p>
                <p className="mt-1 text-4xl font-extrabold tracking-tight text-slate-900">
                  {result.score} <span className="text-xl font-bold text-slate-400">/ {result.total_marks}</span>
                </p>
                <p className="mt-1 text-sm font-semibold text-[#5B50E6]">{pct}%</p>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <Stat icon={CheckCircle2} color="text-emerald-600" bg="bg-emerald-50" label="Correct" value={result.correct} />
                <Stat icon={XCircle} color="text-rose-600" bg="bg-rose-50" label="Wrong" value={result.wrong} />
                <Stat icon={MinusCircle} color="text-slate-500" bg="bg-slate-100" label="Skipped" value={result.unattempted} />
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="mb-3 text-sm font-extrabold text-slate-900">Subject-wise breakdown</p>
                <div className="space-y-2.5">
                  {Object.entries(result.per_subject).map(([s, v]) => (
                    <div key={s} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                      <span className="text-sm font-bold text-slate-700">{s}</span>
                      <div className="flex items-center gap-3 text-xs font-semibold">
                        <span className="text-emerald-600">{v.correct} correct</span>
                        <span className="text-rose-600">{v.wrong} wrong</span>
                        <span className="rounded-md bg-[#312E81] px-2 py-1 text-white">{v.score} marks</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={() => { setReview(true); setCur(0); setSubFilter(subjects[0] || ""); }} className="mt-4 w-full rounded-xl bg-[#312E81] py-3 text-sm font-bold text-white transition-all hover:bg-[#3730A3]">
                Review Answers
              </button>
            </>
          ) : (
            <ReviewList quiz={quiz} answers={answers} result={result} onBack={() => setReview(false)} />
          )}
        </main>
      </div>
    );
  }

  // ---------------- TEST ----------------
  const q = questions[cur];
  const answeredCount = Object.keys(answers).length;
  const lowTime = timeLeft <= 300;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="sticky top-0 z-40 bg-[#5B50E6]">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2 text-white">
            <Stethoscope className="h-5 w-5" />
            <h1 className="text-base font-extrabold md:text-lg">{quiz.title}</h1>
          </div>
          <div className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-bold ${lowTime ? "bg-rose-500 text-white" : "bg-white/15 text-white"}`}>
            <Clock className="h-4 w-4" />
            {fmt(timeLeft)}
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-5 px-4 py-5 md:grid-cols-[1fr_260px]">
        {/* Question column */}
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {subjects.map((s) => (
              <button
                key={s}
                onClick={() => { setSubFilter(s); const f = questions.findIndex((qq) => qq.subject === s); if (f >= 0) setCur(f); }}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all ${subFilter === s ? "bg-[#5B50E6] text-white" : "border border-slate-200 bg-white text-slate-600"}`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-extrabold text-slate-900">Question {cur + 1}<span className="text-slate-400"> / {questions.length}</span></span>
              <span className={`rounded-md border px-2 py-0.5 text-[11px] font-bold ${SUBJECT_COLORS[q.subject] || "text-slate-600 bg-slate-50 border-slate-200"}`}>{q.subject}</span>
            </div>
            <p className="whitespace-pre-line text-[15px] font-medium leading-relaxed text-slate-800">{q.question}</p>

            <div className="mt-4 space-y-2.5">
              {q.options.map((opt, oi) => {
                const active = answers[q.id] === oi;
                return (
                  <button
                    key={oi}
                    onClick={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
                    className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all ${active ? "border-[#5B50E6] bg-indigo-50 ring-1 ring-[#5B50E6]" : "border-slate-200 bg-white hover:border-slate-300"}`}
                  >
                    <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold ${active ? "border-[#5B50E6] bg-[#5B50E6] text-white" : "border-slate-300 text-slate-500"}`}>{oi + 1}</span>
                    <span className={`whitespace-pre-line ${active ? "font-semibold text-slate-900" : "text-slate-700"}`}>{opt}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex items-center justify-between">
              <button
                disabled={cur === 0}
                onClick={() => setCur((c) => Math.max(0, c - 1))}
                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </button>
              {answers[q.id] !== undefined && (
                <button onClick={() => setAnswers((a) => { const n = { ...a }; delete n[q.id]; return n; })} className="text-xs font-semibold text-slate-400 hover:text-rose-500">Clear</button>
              )}
              <button
                disabled={cur === questions.length - 1}
                onClick={() => setCur((c) => Math.min(questions.length - 1, c + 1))}
                className="flex items-center gap-1 rounded-lg bg-[#5B50E6] px-4 py-2 text-sm font-bold text-white transition-all hover:bg-[#4a41c9] disabled:opacity-40"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Palette */}
        <aside className="md:sticky md:top-20 md:self-start">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between text-xs font-bold text-slate-500">
              <span>Answered</span>
              <span className="text-[#5B50E6]">{answeredCount}/{questions.length}</span>
            </div>
            <div className="grid grid-cols-6 gap-1.5">
              {filtered.map(({ q: fq, i }) => {
                const done = answers[fq.id] !== undefined;
                const isCur = i === cur;
                return (
                  <button
                    key={fq.id}
                    onClick={() => setCur(i)}
                    className={`flex h-8 w-8 items-center justify-center rounded-md text-[11px] font-bold transition-all ${isCur ? "bg-[#312E81] text-white ring-2 ring-offset-1 ring-[#312E81]" : done ? "bg-emerald-500 text-white" : "border border-slate-200 bg-white text-slate-600"}`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <button
              onClick={doSubmit}
              disabled={submitting}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white transition-all hover:bg-emerald-700 disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Submit Test
            </button>
            <p className="mt-2 text-center text-[11px] text-slate-400">+4 correct · −1 wrong</p>
          </div>
        </aside>
      </main>
    </div>
  );
}

function Stat({ icon: Icon, color, bg, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-sm">
      <div className={`mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-lg ${bg} ${color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-lg font-extrabold text-slate-900">{value}</p>
      <p className="text-[11px] font-semibold text-slate-500">{label}</p>
    </div>
  );
}

function ReviewList({ quiz, result, onBack }) {
  const byId = Object.fromEntries(result.review.map((r) => [r.id, r]));
  return (
    <div>
      <button onClick={onBack} className="mb-3 flex items-center gap-1 text-sm font-bold text-[#5B50E6]">
        <ChevronLeft className="h-4 w-4" /> Back to summary
      </button>
      <div className="space-y-3">
        {quiz.questions.map((q, idx) => {
          const r = byId[q.id] || {};
          const badge = r.status === "correct" || r.status === "bonus"
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : r.status === "wrong" ? "bg-rose-50 text-rose-700 border-rose-200"
            : "bg-slate-100 text-slate-500 border-slate-200";
          return (
            <div key={q.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-extrabold text-slate-900">Q{idx + 1} <span className="font-semibold text-slate-400">· {q.subject}</span></span>
                <span className={`rounded-md border px-2 py-0.5 text-[11px] font-bold capitalize ${badge}`}>{r.status || "unattempted"}</span>
              </div>
              <p className="whitespace-pre-line text-sm font-medium leading-relaxed text-slate-800">{q.question}</p>
              <div className="mt-3 space-y-1.5">
                {q.options.map((opt, oi) => {
                  const isCorrect = r.correct === oi;
                  const isSel = r.selected === oi;
                  return (
                    <div key={oi} className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${isCorrect ? "border-emerald-300 bg-emerald-50" : isSel ? "border-rose-300 bg-rose-50" : "border-slate-100 bg-white"}`}>
                      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold ${isCorrect ? "border-emerald-500 bg-emerald-500 text-white" : isSel ? "border-rose-400 bg-rose-400 text-white" : "border-slate-300 text-slate-500"}`}>{oi + 1}</span>
                      <span className={`whitespace-pre-line ${isCorrect ? "font-semibold text-emerald-800" : "text-slate-700"}`}>{opt}</span>
                      {isCorrect && <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-emerald-600" />}
                      {isSel && !isCorrect && <XCircle className="ml-auto h-4 w-4 shrink-0 text-rose-500" />}
                    </div>
                  );
                })}
                {r.correct === null && <p className="text-xs font-semibold text-amber-600">Bonus / no correct option — marks awarded if attempted.</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
