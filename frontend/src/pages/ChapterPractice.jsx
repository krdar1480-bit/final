import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getChapterBank, editChapterQuestion, chapterImageUrl } from "@/lib/api";
import { Header } from "@/components/Header";
import { toast } from "sonner";
import { Atom, Loader2, CheckCircle2, XCircle, Eye, Lightbulb, ChevronRight, ChevronLeft, Layers, Pencil, Save, X, Maximize2 } from "lucide-react";
import ImageZoomModal from "@/components/ImageZoomModal";
import MathText from "@/components/MathText";

const DIFF_COLORS = {
  Easy: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  Hard: "bg-rose-50 text-rose-700 border-rose-200",
};
const LETTERS = ["a", "b", "c", "d"];

export default function ChapterPractice() {
  const { bankKey } = useParams();
  const [bank, setBank] = useState(null);
  const [error, setError] = useState(false);
  const [picks, setPicks] = useState({});     // { qno: "a" }
  const [revealed, setRevealed] = useState({}); // { qno: true }
  const [hinted, setHinted] = useState({});     // { qno: true }
  const [openTopic, setOpenTopic] = useState(null); // null = show topic list
  const [curIdx, setCurIdx] = useState(0);      // index within the open topic
  const [activeTag, setActiveTag] = useState("All"); // similarity-tag filter
  const [editing, setEditing] = useState({});   // { qno: true }
  const [drafts, setDrafts] = useState({});     // { qno: {question, options, answer} }
  const [saving, setSaving] = useState({});     // { qno: true }
  const [zoom, setZoom] = useState(null);       // { src, alt } or null
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const startEdit = (q) => {
    setDrafts((d) => ({ ...d, [q.question_no]: {
      question: q.question,
      options: { ...q.options },
      answer: q.answer,
      explanation: q.explanation || "",
      concepts: (q.concepts || []).join("\n"),
      formulas: (q.formulas || []).join("\n"),
    } }));
    setEditing((e) => ({ ...e, [q.question_no]: true }));
  };
  const cancelEdit = (qno) => setEditing((e) => ({ ...e, [qno]: false }));
  const setDraft = (qno, patch) => setDrafts((d) => ({ ...d, [qno]: { ...d[qno], ...patch } }));
  const setDraftOption = (qno, letter, val) =>
    setDrafts((d) => ({ ...d, [qno]: { ...d[qno], options: { ...d[qno].options, [letter]: val } } }));

  const saveEdit = async (qno) => {
    const draft = drafts[qno];
    if (!draft) return;
    setSaving((s) => ({ ...s, [qno]: true }));
    const concepts = (draft.concepts || "").split("\n").map((x) => x.trim()).filter(Boolean);
    const formulas = (draft.formulas || "").split("\n").map((x) => x.trim()).filter(Boolean);
    try {
      await editChapterQuestion(bankKey, qno, {
        question: draft.question, options: draft.options, answer: draft.answer,
        explanation: draft.explanation, concepts, formulas,
      });
      // update local bank
      setBank((b) => {
        const nb = { ...b, sections: b.sections.map((sec) => ({
          ...sec,
          questions: sec.questions.map((q) => q.question_no === qno ? {
            ...q, question: draft.question, options: draft.options, answer: draft.answer,
            explanation: draft.explanation, concepts, formulas,
          } : q),
        })) };
        return nb;
      });
      setEditing((e) => ({ ...e, [qno]: false }));
      toast.success(`Question ${qno} saved`);
    } catch (err) {
      toast.error("Could not save changes");
    } finally {
      setSaving((s) => ({ ...s, [qno]: false }));
    }
  };

  useEffect(() => {
    getChapterBank(bankKey).then(setBank).catch(() => setError(true));
  }, [bankKey]);

  // Prefetch adjacent questions' images in advance so Next/Previous is instant
  // (no more waiting for the image to download only after you navigate).
  useEffect(() => {
    if (!bank || !openTopic) return;
    const sec = bank.sections.find((s) => s.topic === openTopic);
    if (!sec) return;
    const sorted = [...sec.questions].sort((a, b) => (a.similarity_tag || "").localeCompare(b.similarity_tag || "", undefined, { numeric: true }));
    const working = activeTag === "All" ? sorted : sorted.filter((q) => q.similarity_tag === activeTag);
    const total = working.length;
    const idx = Math.min(curIdx, total - 1);
    // Warm the browser cache for the next two and the previous question.
    [working[idx + 1], working[idx + 2], working[idx - 1]].filter(Boolean).forEach((q) => {
      const urls = [q.question_image, q.solution_image, ...Object.values(q.option_images || {})].filter(Boolean);
      urls.forEach((u) => {
        const img = new Image();
        img.src = chapterImageUrl(u);
      });
    });
  }, [bank, openTopic, activeTag, curIdx]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <p className="text-slate-600">Practice set not available yet.</p>
      </div>
    );
  }
  if (!bank) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  const activeSection = openTopic ? bank.sections.find((s) => s.topic === openTopic) : null;
  const diffCount = (sec, d) => sec.questions.filter((q) => q.difficulty === d).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header
        showBack
        title={bank.chapter}
        Icon={Atom}
        bgClass="bg-blue-600"
        onBack={(goBack) => {
          if (openTopic) { setOpenTopic(null); window.scrollTo(0, 0); }
          else goBack();
        }}
      />

      <main className="mx-auto max-w-3xl px-4 py-6 md:px-6">
        {!openTopic && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-extrabold text-white">{bank.source || "PYQs"}</span>
            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">{bank.total_questions} questions</span>
            <span className="ml-auto text-xs font-medium text-slate-400">Chapter {bank.chapter_no}</span>
          </div>
        )}

        {/* Topic list (tap to open) */}
        {!openTopic ? (
          <div data-testid="topic-list" className="space-y-3">
            {bank.sections.map((sec, i) => (
              <button
                key={sec.topic}
                onClick={() => { setOpenTopic(sec.topic); setCurIdx(0); setActiveTag("All"); window.scrollTo(0, 0); }}
                style={{ animationDelay: `${i * 40}ms` }}
                className="group flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                  <Layers className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-extrabold text-slate-900">{sec.topic}</p>
                  <p className="mt-0.5 flex flex-wrap gap-1.5 text-[11px] font-semibold">
                    <span className="text-slate-500">{sec.questions.length} questions</span>
                    {diffCount(sec, "Easy") > 0 && <span className="text-emerald-600">· {diffCount(sec, "Easy")} Easy</span>}
                    {diffCount(sec, "Medium") > 0 && <span className="text-amber-600">· {diffCount(sec, "Medium")} Med</span>}
                    {diffCount(sec, "Hard") > 0 && <span className="text-rose-600">· {diffCount(sec, "Hard")} Hard</span>}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-blue-600" />
              </button>
            ))}
          </div>
        ) : (
          <>
            <div className="space-y-6">
          {(activeSection ? [activeSection] : []).map((sec) => {
            const sorted = [...sec.questions].sort((a, b) => (a.similarity_tag || "").localeCompare(b.similarity_tag || "", undefined, { numeric: true }));
            const tags = ["All", ...Array.from(new Set(sorted.map((q) => q.similarity_tag).filter(Boolean)))];
            const working = activeTag === "All" ? sorted : sorted.filter((q) => q.similarity_tag === activeTag);
            const total = working.length;
            const idx = Math.min(curIdx, total - 1);
            return (
            <section key={sec.topic}>

              {/* Similarity-tag groups */}
              {tags.length > 2 && (
                <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
                  {tags.map((t) => (
                    <button
                      key={t}
                      onClick={() => { setActiveTag(t); setCurIdx(0); window.scrollTo(0, 0); }}
                      className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold transition-all ${activeTag === t ? "bg-blue-600 text-white" : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}
                    >
                      {t === "All" ? "All Tags" : t}
                    </button>
                  ))}
                </div>
              )}

              <div className="space-y-4">
                {[working[idx]].filter(Boolean).map((q) => {
                  const pick = picks[q.question_no];
                  const show = revealed[q.question_no];
                  const hint = hinted[q.question_no];
                  const hasHint = (q.concepts?.length || q.formulas?.length);
                  const isEditing = editing[q.question_no];
                  const draft = drafts[q.question_no] || {};

                  // ---- Image-mode question (pixel-perfect from source PDF) ----
                  if (q.question_image) {
                    const useQLatex = isMobile && !!q.question_latex;
                    const useSolLatex = isMobile && !!q.explanation_latex;
                    return (
                      <div key={q.question_no} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <span className="flex h-6 min-w-6 items-center justify-center rounded-md bg-blue-600 px-1.5 text-xs font-extrabold text-white">{q.question_no}</span>
                          {q.year && <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-bold text-slate-600">{q.year}</span>}
                          {!useQLatex && (
                            <button
                              type="button"
                              onClick={() => setZoom({ src: chapterImageUrl(q.question_image), alt: `Question ${q.question_no}` })}
                              className="ml-auto flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-600 transition-all hover:border-blue-300 hover:text-blue-600"
                              title="Zoom question"
                            >
                              <Maximize2 className="h-3.5 w-3.5" /> Zoom
                            </button>
                          )}
                        </div>

                        {useQLatex ? (
                          <MathText className="block whitespace-pre-line text-[15px] font-medium leading-relaxed text-slate-800">
                            {q.question_latex}
                          </MathText>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setZoom({ src: chapterImageUrl(q.question_image), alt: `Question ${q.question_no}` })}
                            className="block w-full overflow-hidden rounded-xl border border-slate-100 bg-white text-left"
                            title="Tap to zoom"
                          >
                            <img
                              src={chapterImageUrl(q.question_image)}
                              alt={`Question ${q.question_no}`}
                              className="mx-auto block h-auto w-full max-w-full"
                              loading="lazy"
                            />
                          </button>
                        )}

                        <div className="mt-4">
                          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">Choose your answer</p>
                          <div className="space-y-2.5">
                            {LETTERS.map((L) => {
                              const optImg = q.option_images?.[L];
                              if (!optImg) return null;
                              const isPick = pick === L;
                              const isAns = q.answer === L;
                              let cls = "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/40";
                              let badge = "border-slate-300 text-slate-500";
                              if (show) {
                                if (isAns) { cls = "border-emerald-400 bg-emerald-50"; badge = "border-emerald-500 bg-emerald-500 text-white"; }
                                else if (isPick) { cls = "border-rose-300 bg-rose-50"; badge = "border-rose-400 bg-rose-400 text-white"; }
                                else { cls = "border-slate-200 bg-white opacity-70"; }
                              } else if (isPick) {
                                cls = "border-blue-500 bg-blue-50 ring-1 ring-blue-500"; badge = "border-blue-500 bg-blue-500 text-white";
                              }
                              return (
                                <button
                                  key={L}
                                  disabled={show}
                                  onClick={() => setPicks((p) => ({ ...p, [q.question_no]: L }))}
                                  className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all ${cls}`}
                                >
                                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold uppercase ${badge}`}>{L}</span>
                                  {isMobile && q.options_latex?.[L] ? (
                                    <MathText className="min-w-0 flex-1 text-[15px] text-slate-800">
                                      {q.options_latex[L]}
                                    </MathText>
                                  ) : (
                                    <span className="min-w-0 flex-1 overflow-hidden">
                                      <img
                                        src={chapterImageUrl(optImg)}
                                        alt={`Option ${L.toUpperCase()}`}
                                        className="h-auto max-h-8 w-auto max-w-full object-contain md:max-h-20"
                                        loading="lazy"
                                      />
                                    </span>
                                  )}
                                  {show && isAns && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />}
                                  {show && isPick && !isAns && <XCircle className="h-4 w-4 shrink-0 text-rose-500" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {!show ? (
                          <div className="mt-4">
                            <button
                              onClick={() => setRevealed((r) => ({ ...r, [q.question_no]: true }))}
                              className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3.5 py-2 text-xs font-bold text-white transition-all hover:bg-slate-900"
                            >
                              <Eye className="h-3.5 w-3.5" /> Show Answer & Solution
                            </button>
                          </div>
                        ) : (
                          <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
                            <p className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-emerald-700">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Answer · {q.answer?.toUpperCase()}
                              {pick && (
                                <span className={`ml-1 rounded px-1.5 py-0.5 text-[10px] ${pick === q.answer ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-600"}`}>
                                  {pick === q.answer ? "You got it right" : `You chose ${pick.toUpperCase()}`}
                                </span>
                              )}
                              {q.solution_image && !useSolLatex && (
                                <button
                                  type="button"
                                  onClick={() => setZoom({ src: chapterImageUrl(q.solution_image), alt: `Solution ${q.question_no}` })}
                                  className="ml-auto flex items-center gap-1 rounded-md border border-emerald-200 bg-white px-2 py-1 text-[11px] font-bold normal-case text-emerald-700 transition-all hover:border-emerald-400"
                                  title="Zoom solution"
                                >
                                  <Maximize2 className="h-3.5 w-3.5" /> Zoom
                                </button>
                              )}
                            </p>
                            {useSolLatex ? (
                              <MathText className="block whitespace-pre-line text-sm leading-relaxed text-slate-700">
                                {q.explanation_latex}
                              </MathText>
                            ) : q.solution_image ? (
                              <button
                                type="button"
                                onClick={() => setZoom({ src: chapterImageUrl(q.solution_image), alt: `Solution ${q.question_no}` })}
                                className="block w-full overflow-hidden rounded-lg border border-emerald-100 bg-white text-left"
                                title="Tap to zoom"
                              >
                                <img
                                  src={chapterImageUrl(q.solution_image)}
                                  alt={`Solution ${q.question_no}`}
                                  className="mx-auto block h-auto w-full max-w-full"
                                  loading="lazy"
                                />
                              </button>
                            ) : null}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div key={q.question_no} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="flex h-6 min-w-6 items-center justify-center rounded-md bg-blue-600 px-1.5 text-xs font-extrabold text-white">{q.question_no}</span>
                        <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-bold text-slate-600">{q.year}</span>
                        {q.difficulty && (
                          <span className={`rounded-md border px-2 py-0.5 text-[11px] font-bold ${DIFF_COLORS[q.difficulty] || "bg-slate-50 text-slate-600 border-slate-200"}`}>{q.difficulty}</span>
                        )}
                        {q.similarity_tag && (
                          <span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700">{q.similarity_tag}</span>
                        )}
                        {q.interconnected && q.interconnected !== "no" && (
                          <span
                            title={typeof q.interconnected === "string" && q.interconnected.includes("[") ? `Connected: ${q.interconnected.replace(/^yes\s*/i, "")}` : "Interconnected question"}
                            className="flex h-6 w-6 items-center justify-center rounded-full border border-orange-300 bg-orange-500 text-[11px] font-extrabold text-white"
                          >
                            C
                          </span>
                        )}
                        {!isEditing && (
                          <button
                            onClick={() => startEdit(q)}
                            title="Edit question"
                            className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all hover:border-blue-300 hover:text-blue-600"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      {!isEditing && q.approach && (
                        <p className="mb-2 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 font-bold uppercase text-slate-400">Approach</span>
                          <span className="capitalize">{q.approach}</span>
                        </p>
                      )}
                      {!isEditing && q.interconnected && q.interconnected !== "no" && q.interconnected.includes("[") && (
                        <p className="mb-2 text-[11px] font-semibold text-orange-600">
                          Connected to: {q.interconnected.replace(/^yes\s*/i, "").replace(/[\[\]]/g, "")}
                        </p>
                      )}

                      {isEditing ? (
                        <div className="space-y-3">
                          <div>
                            <label className="mb-1 block text-[11px] font-bold uppercase text-slate-400">Question</label>
                            <textarea
                              value={draft.question || ""}
                              onChange={(e) => setDraft(q.question_no, { question: e.target.value })}
                              rows={4}
                              className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-[11px] font-bold uppercase text-slate-400">Options (tap circle to mark correct)</label>
                            {LETTERS.map((L) => (
                              draft.options?.[L] === undefined ? null : (
                                <div key={L} className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setDraft(q.question_no, { answer: L })}
                                    title="Mark as correct answer"
                                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold uppercase transition-all ${draft.answer === L ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 text-slate-500 hover:border-emerald-400"}`}
                                  >
                                    {L}
                                  </button>
                                  <input
                                    value={draft.options[L]}
                                    onChange={(e) => setDraftOption(q.question_no, L, e.target.value)}
                                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                  />
                                </div>
                              )
                            ))}
                          </div>
                          <div>
                            <label className="mb-1 block text-[11px] font-bold uppercase text-slate-400">Answer explanation</label>
                            <textarea
                              value={draft.explanation || ""}
                              onChange={(e) => setDraft(q.question_no, { explanation: e.target.value })}
                              rows={3}
                              className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <label className="mb-1 block text-[11px] font-bold uppercase text-amber-600">Hint · Concepts (one per line)</label>
                              <textarea
                                value={draft.concepts || ""}
                                onChange={(e) => setDraft(q.question_no, { concepts: e.target.value })}
                                rows={3}
                                className="w-full resize-y rounded-lg border border-amber-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-[11px] font-bold uppercase text-amber-600">Hint · Formulas (one per line)</label>
                              <textarea
                                value={draft.formulas || ""}
                                onChange={(e) => setDraft(q.question_no, { formulas: e.target.value })}
                                rows={3}
                                className="w-full resize-y rounded-lg border border-amber-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={() => saveEdit(q.question_no)}
                              disabled={saving[q.question_no]}
                              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-emerald-700 disabled:opacity-60"
                            >
                              {saving[q.question_no] ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                              Save Changes
                            </button>
                            <button
                              onClick={() => cancelEdit(q.question_no)}
                              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 transition-all hover:border-slate-300"
                            >
                              <X className="h-3.5 w-3.5" /> Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                      <>
                      <p className="whitespace-pre-line text-[15px] font-medium leading-relaxed text-slate-800">{q.question}</p>

                      <div className="mt-3 space-y-2">
                        {LETTERS.map((L) => {
                          if (q.options?.[L] === undefined) return null;
                          const isPick = pick === L;
                          const isAns = q.answer === L;
                          let cls = "border-slate-200 bg-white hover:border-slate-300";
                          if (show) {
                            if (isAns) cls = "border-emerald-300 bg-emerald-50";
                            else if (isPick) cls = "border-rose-300 bg-rose-50";
                          } else if (isPick) {
                            cls = "border-blue-500 bg-blue-50 ring-1 ring-blue-500";
                          }
                          return (
                            <button
                              key={L}
                              disabled={show}
                              onClick={() => setPicks((p) => ({ ...p, [q.question_no]: L }))}
                              className={`flex w-full items-start gap-3 rounded-xl border px-4 py-2.5 text-left text-sm transition-all ${cls}`}
                            >
                              <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold uppercase ${show && isAns ? "border-emerald-500 bg-emerald-500 text-white" : show && isPick ? "border-rose-400 bg-rose-400 text-white" : isPick ? "border-blue-500 bg-blue-500 text-white" : "border-slate-300 text-slate-500"}`}>{L}</span>
                              <span className="whitespace-pre-line text-slate-700">{q.options[L]}</span>
                              {show && isAns && <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-emerald-600" />}
                              {show && isPick && !isAns && <XCircle className="ml-auto h-4 w-4 shrink-0 text-rose-500" />}
                            </button>
                          );
                        })}
                      </div>

                      {/* Hint (required to solve) — shown on demand or with the answer */}
                      {hasHint && (hint || show) ? (
                        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3.5">
                          <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-amber-700">
                            <Lightbulb className="h-3.5 w-3.5" /> Required to solve
                          </p>
                          <div className="mt-2 grid gap-2 sm:grid-cols-2">
                            {q.concepts?.length ? (
                              <div className="rounded-lg border border-amber-100 bg-white p-2.5">
                                <p className="mb-1 text-[11px] font-bold uppercase text-slate-400">Concepts</p>
                                <ul className="list-inside list-disc text-xs text-slate-600">
                                  {q.concepts.map((c, i) => <li key={i}>{c}</li>)}
                                </ul>
                              </div>
                            ) : null}
                            {q.formulas?.length ? (
                              <div className="rounded-lg border border-amber-100 bg-white p-2.5">
                                <p className="mb-1 text-[11px] font-bold uppercase text-slate-400">Formulas</p>
                                <ul className="space-y-0.5 text-xs font-medium text-slate-700">
                                  {q.formulas.map((f, i) => <li key={i}>{f}</li>)}
                                </ul>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ) : null}

                      {!show ? (
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {hasHint && !hint && (
                            <button
                              onClick={() => setHinted((h) => ({ ...h, [q.question_no]: true }))}
                              className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-700 transition-all hover:bg-amber-100"
                            >
                              <Lightbulb className="h-3.5 w-3.5" /> Hint
                            </button>
                          )}
                          <button
                            onClick={() => setRevealed((r) => ({ ...r, [q.question_no]: true }))}
                            className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3.5 py-2 text-xs font-bold text-white transition-all hover:bg-slate-900"
                          >
                            <Eye className="h-3.5 w-3.5" /> Show Answer
                          </button>
                        </div>
                      ) : (
                        <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3.5">
                          <p className="text-xs font-extrabold uppercase tracking-wide text-emerald-700">Answer · {q.answer?.toUpperCase()}</p>
                          {q.explanation && <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-slate-700">{q.explanation}</p>}
                        </div>
                      )}
                      </>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 flex items-center justify-between">
                <button
                  disabled={idx === 0}
                  onClick={() => { setCurIdx(idx - 1); window.scrollTo(0, 0); }}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </button>
                <span className="text-xs font-bold text-slate-400">{idx + 1} / {total}</span>
                <button
                  disabled={idx >= total - 1}
                  onClick={() => { setCurIdx(idx + 1); window.scrollTo(0, 0); }}
                  className="flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-blue-700 disabled:opacity-40"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </section>
            );
          })}
            </div>
          </>
        )}
      </main>
      {zoom && <ImageZoomModal src={zoom.src} alt={zoom.alt} onClose={() => setZoom(null)} />}
    </div>
  );
}
