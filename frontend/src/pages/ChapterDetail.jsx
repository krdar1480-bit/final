import React from "react";
import { useParams } from "react-router-dom";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { getSubject } from "@/lib/api";
import { Header } from "@/components/Header";
import { ACCENTS } from "@/lib/theme";
import { BLUEPRINTS, MARK_COLORS } from "@/lib/blueprints";
import { chapterSections } from "@/lib/examPatterns";
import { Atom, FlaskConical, Sigma, Dna, Cpu, BookOpen, Languages, ScrollText, FileQuestion } from "lucide-react";

const ICONS = { Atom, FlaskConical, Sigma, Dna, Cpu, BookOpen, Languages, ScrollText };

export default function ChapterDetail() {
  const { subjectId, ch } = useParams();
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
  const row = bp?.rows.find((r) => String(r.ch) === String(ch));

  // Build the list of exam question-types this chapter appears in, using the
  // subject's pattern metadata (label/full/each) joined with the chapter->type map.
  const patternMeta = subject?.patterns || [];
  const sections = row ? chapterSections(subjectId, row.chapter) : [];
  const parts = [];
  // 1-mark (MCQ & FBK / Part A) comes from the blueprint weightage.
  if (row && row.vals?.A) {
    const n = row.vals.A;
    parts.push({ key: "A", mark: "1", name: "1M · MCQ & FBK", count: n, total: n });
  }
  sections.forEach((s) => {
    const meta = patternMeta.find((p) => p.type === s.type);
    if (!meta) return;
    const mark = s.mark != null ? s.mark : meta.each;
    parts.push({
      key: s.type,
      mark: String(mark),
      name: `${mark}M · ${meta.full || meta.label}`,
      count: s.count,
      total: mark * s.count,
    });
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header showBack title={subject?.name || ""} Icon={Icon} bgClass={accent.icon} />

      <main className="mx-auto max-w-2xl px-4 py-8 md:px-6">
        {row ? (
          <>
            <div className="mb-6 flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-extrabold text-white ${accent.icon}`}>
                {row.ch}
              </span>
              <div>
                <h1 className="text-lg font-extrabold tracking-tight text-slate-900 md:text-xl">{row.chapter}</h1>
                <p className="text-sm text-slate-500">
                  {row.marks} marks weightage · {row.hours} teaching hours
                </p>
              </div>
            </div>

            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Appears in these question types</h2>
            <div data-testid="chapter-weightage" className="space-y-3">
              {parts.map((p) => {
                const c = MARK_COLORS[p.mark] || MARK_COLORS["1"];
                return (
                  <div
                    key={p.key}
                    data-testid={`weightage-part-${p.key}`}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
                  >
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-sm font-extrabold ${c.badge}`}>
                      {p.mark}m
                    </span>
                    <div>
                      <p className="text-sm font-extrabold text-slate-900">{p.name}</p>
                      {p.count > 1 && <p className="text-xs text-slate-500">{p.mark} × {p.count} = {p.total}</p>}
                    </div>
                    <span className={`ml-auto rounded-lg px-3 py-1.5 text-sm font-bold text-white ${accent.icon}`}>
                      {p.total} marks
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <span className="text-sm font-bold text-slate-700">Total chapter weightage</span>
              <span className="text-base font-extrabold text-slate-900">{row.marks} marks</span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
            <FileQuestion className="mb-2 h-8 w-8 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">Chapter details not available</p>
          </div>
        )}
      </main>
    </div>
  );
}
