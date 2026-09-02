import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getSubject } from "@/lib/api";
import { Header } from "@/components/Header";
import { ACCENTS } from "@/lib/theme";
import {
  Atom, FlaskConical, Sigma, Dna, Cpu, BookOpen, Languages, ScrollText, FileText, Lock,
} from "lucide-react";

const ICONS = { Atom, FlaskConical, Sigma, Dna, Cpu, BookOpen, Languages, ScrollText };

// Subjects that show the year-wise paper archive list.
// Physics has real uploaded PDFs; chemistry & math show the list with every item as "Soon" until PDFs are uploaded.
const SUPPORTED = ["physics", "chemistry", "math"];

// Year-wise list. Only the 2027 Blueprint + 5 Model Papers are actually available;
// the older years are placeholders (not yet uploaded) and are not tappable.
const PAPERS = [
  { label: "2027 - Blueprint for Model Papers", kind: "blueprint", available: true },
  { label: "2027 - Model Paper 5", pdf: 5, available: true },
  { label: "2027 - Model Paper 4", pdf: 4, available: true },
  { label: "2027 - Model Paper 3", pdf: 3, available: true },
  { label: "2027 - Model Paper 2", pdf: 2, available: true },
  { label: "2027 - Model Paper 1", pdf: 1, available: true },
  { label: "2026 - Exam 2", available: false },
  { label: "2026 - Exam 1", available: false },
  { label: "2025 - Exam 3", available: false },
  { label: "2025 - Exam 2", available: false },
  { label: "2025 - Exam 1", available: false },
  { label: "2024 - Exam 3", available: false },
  { label: "2024 - Exam 2", available: false },
  { label: "2024 - Exam 1", available: false },
  { label: "2023 - Main Exam", available: false },
  { label: "2023 - Supplementary", available: false },
  { label: "2023 - Supplementary 2", available: false },
];

export default function FullPaper() {
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
  const supported = SUPPORTED.includes(subjectId);
  // Subjects with uploaded 2027 papers (blueprint + 5 model papers)
  const hasUploads = ["physics", "chemistry", "math"].includes(subjectId);
  const papers = hasUploads
    ? PAPERS
    : PAPERS.map((p) => ({ label: p.label, available: false }));

  const handleClick = (p) => {
    if (!p.available) {
      toast("Not available yet", { description: "This paper will be uploaded soon." });
      return;
    }
    if (p.kind === "blueprint") navigate(`/subject/${subjectId}/blueprint`);
    else navigate(`/subject/${subjectId}/papers/${p.pdf}`);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header showBack title={subject ? `${subject.name} Question Papers` : ""} Icon={Icon} bgClass={accent.icon} />

      <main className="mx-auto max-w-2xl px-4 py-6 md:px-6">
        {supported ? (
          <div className="space-y-3">
            {papers.map((p, i) => (
              <button
                key={i}
                data-testid={`paper-item-${i}`}
                data-available={p.available ? "true" : "false"}
                onClick={() => handleClick(p)}
                style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                className={`animate-fade-up group flex w-full items-center gap-3 rounded-2xl border px-5 py-4 text-left shadow-sm transition-all ${
                  p.available
                    ? "cursor-pointer border-rose-100 bg-rose-50 hover:-translate-y-0.5 hover:bg-rose-100 hover:shadow-md"
                    : "cursor-not-allowed border-slate-200 bg-slate-50"
                }`}
              >
                <span className={`text-lg font-extrabold leading-snug tracking-tight md:text-xl ${p.available ? "text-slate-900" : "text-slate-400"}`}>
                  {p.label}
                </span>
                {!p.available && (
                  <span className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-500 ring-1 ring-rose-100">
                    <Lock className="h-4 w-4" />
                  </span>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-10 flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
            <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${accent.icon} text-white shadow-md`}>
              <FileText className="h-6 w-6" />
            </div>
            <p className="text-base font-bold text-slate-700">Question papers coming soon</p>
            <p className="mt-1 text-sm text-slate-500">
              {subject?.name} paper archive is being prepared.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
