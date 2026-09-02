import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { getFullPaper, chapterImageUrl } from "@/lib/api";
import { Header } from "@/components/Header";
import { Stethoscope, Loader2, CheckCircle2, Eye, Maximize2, ChevronLeft, ChevronRight } from "lucide-react";
import ImageZoomModal from "@/components/ImageZoomModal";

const LETTERS = ["a", "b", "c", "d"];

export default function FullPaperSolutions() {
  const { paperId = "reexam-2026" } = useParams();
  const [paper, setPaper] = useState(null);
  const [error, setError] = useState(false);
  const [subject, setSubject] = useState(null);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState({});
  const [zoom, setZoom] = useState(null);

  useEffect(() => {
    getFullPaper(paperId)
      .then((p) => { setPaper(p); setSubject(p.subjects?.[0] || null); })
      .catch(() => setError(true));
  }, [paperId]);

  const questions = useMemo(() => paper?.questions || [], [paper]);
  const filtered = useMemo(() => questions.filter((q) => q.subject === subject), [questions, subject]);
  const total = filtered.length;
  const cur = Math.min(idx, Math.max(0, total - 1));
  const q = filtered[cur];

  useEffect(() => {
    [filtered[cur + 1], filtered[cur + 2], filtered[cur - 1]].filter(Boolean).forEach((qq) => {
      const urls = [qq.question_image, qq.solution_image, ...Object.values(qq.option_images || {})].filter(Boolean);
      urls.forEach((u) => { const im = new Image(); im.src = chapterImageUrl(u); });
    });
  }, [filtered, cur]);

  if (error) {
    return <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]"><p className="text-slate-600">Solutions are not available yet.</p></div>;
  }
  if (!paper || !q) {
    return <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]"><Loader2 className="h-6 w-6 animate-spin text-[#5B50E6]" /></div>;
  }

  const show = revealed[q.question_no];
  const answerLabel = q.answer ? q.answer.toUpperCase() : "Bonus / No option";
  const hasOptions = q.option_images && LETTERS.some((L) => q.option_images[L]);

  const zoomImg = (img, alt) => setZoom({ src: chapterImageUrl(img), alt });

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header showBack title={paper.title || "Full Paper — Solutions"} Icon={Stethoscope} bgClass="bg-[#5B50E6]" />

      <main className="mx-auto max-w-3xl px-4 py-6 md:px-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="rounded-lg bg-[#5B50E6] px-2.5 py-1 text-xs font-extrabold text-white">With Solutions</span>
          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">{paper.total_questions} questions</span>
          <span className="ml-auto text-xs font-medium text-slate-400">{paper.source}</span>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          {paper.subjects.map((s) => (
            <button
              key={s}
              onClick={() => { setSubject(s); setIdx(0); window.scrollTo(0, 0); }}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${subject === s ? "bg-[#5B50E6] text-white" : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="flex h-6 min-w-6 items-center justify-center rounded-md bg-[#5B50E6] px-1.5 text-xs font-extrabold text-white">{q.question_no}</span>
            {q.year && <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-bold text-slate-600">{q.year}</span>}
            <span className="rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-[#5B50E6]">{q.subject}</span>
            {q.question_image && (
              <button type="button" onClick={() => zoomImg(q.question_image, `Question ${q.question_no}`)}
                className="ml-auto flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-600 transition-all hover:border-indigo-300 hover:text-[#5B50E6]" title="Zoom question">
                <Maximize2 className="h-3.5 w-3.5" /> Zoom
              </button>
            )}
          </div>

          {q.question_image && (
            <button type="button" onClick={() => zoomImg(q.question_image, `Question ${q.question_no}`)}
              className="block w-full overflow-hidden rounded-xl border border-slate-100 bg-white text-left" title="Tap to zoom">
              <img src={chapterImageUrl(q.question_image)} alt={`Question ${q.question_no}`} className="mx-auto block h-auto w-full max-w-full" loading="eager" />
            </button>
          )}

          {hasOptions && (
            <div className="mt-3 space-y-2">
              {LETTERS.map((L) => {
                const oimg = q.option_images[L];
                if (!oimg) return null;
                const correct = show && q.answer === L;
                return (
                  <button
                    key={L}
                    type="button"
                    onClick={() => zoomImg(oimg, `Option ${L.toUpperCase()}`)}
                    className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all ${correct ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white hover:border-indigo-200"}`}
                    title="Tap to zoom"
                  >
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold uppercase ${correct ? "border-emerald-400 bg-emerald-500 text-white" : "border-slate-300 text-slate-500"}`}>{L}</span>
                    <img src={chapterImageUrl(oimg)} alt={`Option ${L}`} className="block h-auto max-h-24 w-auto max-w-full object-contain md:max-h-28" loading="lazy" />
                  </button>
                );
              })}
            </div>
          )}

          {!show ? (
            <div className="mt-4">
              <button onClick={() => setRevealed((r) => ({ ...r, [q.question_no]: true }))}
                className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3.5 py-2 text-xs font-bold text-white transition-all hover:bg-slate-900">
                <Eye className="h-3.5 w-3.5" /> Show Answer & Solution
              </button>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
              <p className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" /> Answer · {answerLabel}
                {q.solution_image && (
                  <button type="button" onClick={() => zoomImg(q.solution_image, `Solution ${q.question_no}`)}
                    className="ml-auto flex items-center gap-1 rounded-md border border-emerald-200 bg-white px-2 py-1 text-[11px] font-bold normal-case text-emerald-700 transition-all hover:border-emerald-400" title="Zoom solution">
                    <Maximize2 className="h-3.5 w-3.5" /> Zoom
                  </button>
                )}
              </p>
              {q.solution_image && (
                <button type="button" onClick={() => zoomImg(q.solution_image, `Solution ${q.question_no}`)}
                  className="block w-full overflow-hidden rounded-lg border border-emerald-100 bg-white text-left" title="Tap to zoom">
                  <img src={chapterImageUrl(q.solution_image)} alt={`Solution ${q.question_no}`} className="mx-auto block h-auto w-full max-w-full" loading="lazy" />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between">
          <button disabled={cur === 0} onClick={() => { setIdx(cur - 1); window.scrollTo(0, 0); }}
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-40">
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>
          <span className="text-xs font-bold text-slate-400">{cur + 1} / {total}</span>
          <button disabled={cur >= total - 1} onClick={() => { setIdx(cur + 1); window.scrollTo(0, 0); }}
            className="flex items-center gap-1 rounded-lg bg-[#5B50E6] px-4 py-2 text-sm font-bold text-white transition-all hover:bg-[#4a41c9] disabled:opacity-40">
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </main>

      {zoom && <ImageZoomModal src={zoom.src} alt={zoom.alt} onClose={() => setZoom(null)} />}
    </div>
  );
}
