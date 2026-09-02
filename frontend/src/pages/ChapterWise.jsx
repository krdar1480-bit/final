import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { getSubject } from "@/lib/api";
import { Header } from "@/components/Header";
import { ACCENTS } from "@/lib/theme";
import { BLUEPRINTS } from "@/lib/blueprints";
import { Atom, FlaskConical, Sigma, Dna, Cpu, BookOpen, Languages, ScrollText, Lock } from "lucide-react";

const ICONS = { Atom, FlaskConical, Sigma, Dna, Cpu, BookOpen, Languages, ScrollText };

// Free (unlocked) chapters per subject — everything else shows a lock symbol.
const FREE_CHAPTERS = {
  physics: [1, 2, 3],
  chemistry: [1, 2, 4],
  math: [3, 4, 12],
};

export default function ChapterWise() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: subject } = useQuery({
    queryKey: ["subject", subjectId],
    queryFn: () => getSubject(subjectId),
    initialData: () => queryClient.getQueryData(["subjects"])?.find((s) => s.id === subjectId),
    staleTime: 5 * 60 * 1000,
  });

  const accent = ACCENTS[subject?.accent] || ACCENTS.physics;
  const Icon = ICONS[subject?.icon] || Atom;
  const bp = BLUEPRINTS[subjectId];
  const chapters = bp ? bp.rows : [];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header showBack title={`${subject?.name || ""} · Chapters`} Icon={Icon} bgClass={accent.icon} />

      <main className="mx-auto max-w-2xl px-4 py-8 md:px-6">
        {chapters.length ? (
          <div data-testid="chapterwise-list" className="space-y-3">
            {chapters.map((c, i) => {
              const isFree = (FREE_CHAPTERS[subjectId] || []).includes(c.ch);
              return (
                <button
                  key={c.ch}
                  type="button"
                  data-testid={`chapterwise-item-${c.ch}`}
                  data-locked={isFree ? "false" : "true"}
                  disabled={!isFree}
                  onClick={() => isFree && navigate(`/subject/${subjectId}/chapters/${c.ch}`)}
                  style={{ animationDelay: `${i * 40}ms` }}
                  className={`animate-fade-up flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left shadow-sm transition-all ${
                    isFree ? "cursor-pointer border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md" : "cursor-not-allowed border-slate-200 bg-slate-50"
                  }`}
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-extrabold text-white ${isFree ? accent.icon : "bg-slate-300"}`}>
                    {c.ch}
                  </span>
                  <span className={`text-sm font-semibold ${isFree ? "text-slate-900" : "text-slate-400"}`}>{c.chapter}</span>
                  {isFree ? (
                    <span className="ml-auto rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">{c.marks} marks</span>
                  ) : (
                    <span className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-500 ring-1 ring-rose-100">
                      <Lock className="h-4 w-4" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div data-testid="chapterwise-empty" className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
            <p className="text-sm font-semibold text-slate-600">Chapters coming soon for {subject?.name}</p>
            <p className="mt-1 text-xs text-slate-400">The chapter-wise breakdown for this subject is being prepared.</p>
          </div>
        )}
      </main>
    </div>
  );
}
