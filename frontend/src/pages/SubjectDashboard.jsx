import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSubject } from "@/lib/api";
import { Header } from "@/components/Header";
import { SubscriptionPaywall } from "@/components/SubscriptionPaywall";
import { ACCENTS } from "@/lib/theme";
import {
  Atom, FlaskConical, Sigma, Dna, Cpu, BookOpen, Languages, ScrollText,
  FileText, BarChart3, ChevronRight, Clock, ArrowLeft, List,
} from "lucide-react";

const ICONS = { Atom, FlaskConical, Sigma, Dna, Cpu, BookOpen, Languages, ScrollText };

// Distinct colour per question type (as sketched)
const TYPE_STYLES = {
  mcq: "border-blue-200 bg-blue-50 text-blue-700",
  fbk: "border-emerald-200 bg-emerald-50 text-emerald-700",
  "2m": "border-violet-200 bg-violet-50 text-violet-700",
  "3m": "border-amber-200 bg-amber-50 text-amber-700",
  "5m": "border-rose-200 bg-rose-50 text-rose-700",
  numeric: "border-cyan-200 bg-cyan-50 text-cyan-700",
};
const TYPE_MARK_BG = {
  mcq: "bg-blue-600", fbk: "bg-emerald-600", "2m": "bg-violet-600",
  "3m": "bg-amber-600", "5m": "bg-rose-600", numeric: "bg-cyan-600",
};

export default function SubjectDashboard() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showPaywall, setShowPaywall] = useState(false);

  const needsSubAll = ["biology", "cs"].includes(subjectId);       // gate every option
  const needsSubTop = ["english", "kannada"].includes(subjectId);  // gate only Full Paper + Blueprint
  const gateTop = needsSubAll || needsSubTop;
  const gateSection = needsSubAll;
  const goTop = (path) => (gateTop ? setShowPaywall(true) : navigate(path));
  const goSection = (path) => (gateSection ? setShowPaywall(true) : navigate(path));

  const { data: subject } = useQuery({
    queryKey: ["subject", subjectId],
    queryFn: () => getSubject(subjectId),
    initialData: () => queryClient.getQueryData(["subjects"])?.find((s) => s.id === subjectId),
    staleTime: 5 * 60 * 1000,
  });
  const patterns = subject?.patterns || [];

  const accent = ACCENTS[subject?.accent] || ACCENTS.physics;
  const Icon = ICONS[subject?.icon] || Atom;
  const total = patterns.reduce((s, p) => s + (p.total || 0), 0);
  const labMarks = subject?.lab_marks || 0;

  // Hindi & Sanskrit (and any coming-soon subject) show a placeholder only
  if (subject?.coming_soon) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <Header showBack title={subject?.name} Icon={Icon} bgClass={accent.icon} />
        <main className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
          <div className={`mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${accent.icon} text-white shadow-lg`}>
            <Clock className="h-8 w-8" />
          </div>
          <h1 data-testid="coming-soon-title" className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
            Coming Soon
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {subject?.name} exam pattern & analytics are being prepared. Check back shortly.
          </p>
          <button
            data-testid="coming-soon-back"
            onClick={() => navigate("/board")}
            className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Subjects
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header showBack title={subject?.name} Icon={Icon} bgClass={accent.icon} />

      <main className="mx-auto max-w-2xl space-y-4 px-4 py-8 md:px-6">
        {/* Full Paper + Analytics — stacked (up & down), two different dark pills */}
        <div className="space-y-3">
          <button data-testid="full-paper-pill" onClick={() => goTop(`/subject/${subjectId}/papers`)} className="flex w-full items-center gap-2.5 rounded-xl bg-indigo-900 px-4 py-3 shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg">
            <FileText className="h-4 w-4 text-indigo-200" />
            <span className="text-sm font-bold text-white">Full Paper</span>
          </button>
          <button data-testid="analytics-pill" onClick={() => goTop(`/subject/${subjectId}/blueprint`)} className="flex w-full items-center gap-2.5 rounded-xl bg-slate-800 px-4 py-3 shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg">
            <BarChart3 className="h-4 w-4 text-slate-300" />
            <span className="text-sm font-bold text-white">Blueprint</span>
          </button>
        </div>

        {/* Question types wrapped by a 3-sided bracket with "70 Marks" on the right */}
        <div className="relative mt-4">
          {/* little left ticks extending out (like the sketch) */}
          <div className="absolute -left-4 top-0 h-0.5 w-4 rounded-full bg-slate-400" />
          <div className="absolute -left-4 bottom-0 h-0.5 w-4 rounded-full bg-slate-400" />

          <div className="rounded-r-3xl border-y-2 border-r-2 border-slate-400 py-3 pl-1 pr-16">
            <div className="space-y-2.5">
              {/* Chapter wise entry (sits inside the marks bracket, above the mark pills) */}
              <button
                data-testid="chapterwise-pill"
                onClick={() => goSection(`/subject/${subjectId}/chapters`)}
                className="group -mr-8 flex w-full items-center gap-2.5 rounded-xl bg-indigo-600 px-4 py-3 text-left shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                <List className="h-4 w-4 text-indigo-200" />
                <span className="text-sm font-bold text-white">Chapter wise</span>
                <ChevronRight className="ml-auto h-4 w-4 text-indigo-200 transition-transform group-hover:translate-x-1" />
              </button>
              {patterns.map((p) => {
                const style = TYPE_STYLES[p.style] || TYPE_STYLES[p.type];
                const markBg = TYPE_MARK_BG[p.style] || TYPE_MARK_BG[p.type];
                // Sectioned subjects (e.g. Kannada) — tap to expand and reveal breakdown
                if (p.children && p.children.length) {
                  // split "(...)" note from the section title so it can be shown like the sketch
                  const m = (p.full || "").match(/^(.*?)\s*(\(.*\))\s*$/);
                  const title = m ? m[1] : p.full;
                  const note = m ? m[2] : "";
                  return (
                    <button
                      key={p.type}
                      data-testid={`type-pill-${p.type}`}
                      onClick={() => goSection(`/subject/${subjectId}/patterns?type=${p.type}`)}
                      className={`group flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${style}`}
                    >
                      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm font-extrabold text-white ${markBg}`}>{p.label}</span>
                      <span className="flex flex-col leading-tight">
                        <span className="font-kannada text-sm font-bold">{title}</span>
                        {note && <span className="font-kannada text-xs font-medium opacity-60">{note}</span>}
                      </span>
                      <span className={`ml-auto rounded-lg px-3 py-1 text-sm font-bold text-white ${markBg}`}>
                        {p.total}m
                      </span>
                      <ChevronRight className="h-4 w-4 opacity-50 transition-transform group-hover:translate-x-1" />
                    </button>
                  );
                }
                // Default subjects — tap navigates to the pattern detail page
                return (
                <button
                  key={p.type}
                  data-testid={`type-pill-${p.type}`}
                  onClick={() => goSection(`/subject/${subjectId}/patterns?type=${p.type}`)}
                  className={`group flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${style}`}
                >
                  <span className="text-base font-extrabold">{p.label}</span>
                  <span className="text-xs font-medium opacity-70">{p.full}</span>
                  <span className={`ml-auto rounded-lg px-3 py-1 text-sm font-bold text-white ${markBg}`}>
                    {p.total}m
                  </span>
                  <ChevronRight className="h-4 w-4 opacity-50 transition-transform group-hover:translate-x-1" />
                </button>
                );
              })}
            </div>
          </div>

          {/* 70 Marks label on the right vertical side */}
          <span
            data-testid="total-marks"
            className="absolute right-4 top-1/2 text-lg font-extrabold tracking-wide text-slate-900"
            style={{ writingMode: "vertical-rl", transform: "translateY(-50%) rotate(180deg)" }}
          >
            {total} Marks
          </span>
        </div>

        {/* LAB / Practicals — wrapped by the bracket line (hidden when subject has no lab) */}
        {labMarks > 0 && (
        <div className="relative mt-1">
          <div className="absolute -left-4 top-0 h-0.5 w-4 rounded-full bg-slate-400" />
          <div className="absolute -left-4 bottom-0 h-0.5 w-4 rounded-full bg-slate-400" />

          <div className="rounded-r-3xl border-y-2 border-r-2 border-slate-400 py-3 pl-1 pr-6">
            <div data-testid="lab-row" className="flex items-center gap-3">
              <button
                type="button"
                data-testid="lab-pill"
                onClick={() => gateSection && setShowPaywall(true)}
                className={`inline-flex items-center gap-2 rounded-lg bg-teal-800 px-3 py-1.5 shadow-md ${gateSection ? "transition-all hover:-translate-y-0.5 hover:shadow-lg" : "cursor-default"}`}
              >
                <span className="text-sm font-extrabold text-white">LAB</span>
                <span className="rounded-md bg-teal-950 px-2 py-0.5 text-xs font-bold text-teal-100">{labMarks}m</span>
              </button>
              <span className="h-0.5 w-6 rounded-full bg-slate-400" />
              <span data-testid="lab-total-marks" className="text-lg font-extrabold text-slate-900">{labMarks} marks</span>
            </div>
          </div>
        </div>
        )}
      </main>

      {showPaywall && (
        <SubscriptionPaywall subjectName={subject?.name} onClose={() => setShowPaywall(false)} />
      )}
    </div>
  );
}
