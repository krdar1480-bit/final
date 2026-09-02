import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getChapterBank, chapterImageUrl } from "@/lib/api";
import { Header } from "@/components/Header";
import { Atom, Loader2, CheckCircle2, Eye, ChevronRight, ChevronLeft, Layers, Maximize2 } from "lucide-react";
import ImageZoomModal from "@/components/ImageZoomModal";

const LETTERS = ["a", "b", "c", "d"];

export default function ChapterPractice() {
  const { bankKey } = useParams();
  const [bank, setBank] = useState(null);
  const [error, setError] = useState(false);
  const [picks, setPicks] = useState({});     // { qno: "a" }
  const [revealed, setRevealed] = useState({}); // { qno: true }
  const [openTopic, setOpenTopic] = useState(null); // null = show topic list
  const [curIdx, setCurIdx] = useState(0);      // index within the open topic
  const [activeTag, setActiveTag] = useState("All"); // similarity-tag filter
  const [zoom, setZoom] = useState(null);       // { src, alt } or null

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

                  // ---- Image-mode question (pixel-perfect from source PDF) ----
                  if (q.question_image) {
                    return (
                      <div key={q.question_no} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <span className="flex h-6 min-w-6 items-center justify-center rounded-md bg-blue-600 px-1.5 text-xs font-extrabold text-white">{q.question_no}</span>
                          {q.year && <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-bold text-slate-600">{q.year}</span>}
                          <button
                            type="button"
                            onClick={() => setZoom({ src: chapterImageUrl(q.question_image), alt: `Question ${q.question_no}` })}
                            className="ml-auto flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-600 transition-all hover:border-blue-300 hover:text-blue-600"
                            title="Zoom question"
                          >
                            <Maximize2 className="h-3.5 w-3.5" /> Zoom
                          </button>
                        </div>

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

                        <div className="mt-4">
                          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">Choose your answer</p>
                          <div className="space-y-2.5">
                            {LETTERS.map((L) => {
                              const optImg = q.option_images?.[L];
                              if (!optImg) return null;
                              const isPick = pick === L;
                              return (
                                <button
                                  key={L}
                                  disabled={show}
                                  onClick={() => setPicks((p) => ({ ...p, [q.question_no]: L }))}
                                  className={`block w-full overflow-hidden rounded-2xl transition-all ${isPick && !show ? "ring-2 ring-blue-500 ring-offset-1" : ""}`}
                                >
                                  <img
                                    src={chapterImageUrl(optImg)}
                                    alt={`Option ${L.toUpperCase()}`}
                                    className="block h-auto w-full"
                                    loading="lazy"
                                  />
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
                              {q.solution_image && (
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
                            {q.solution_image ? (
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

                  return null;
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
