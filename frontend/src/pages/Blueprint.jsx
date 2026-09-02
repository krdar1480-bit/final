import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSubject } from "@/lib/api";
import { Header } from "@/components/Header";
import { ACCENTS } from "@/lib/theme";
import { BLUEPRINTS, MARK_COLORS } from "@/lib/blueprints";
import {
  Atom, FlaskConical, Sigma, Dna, Cpu, BookOpen, Languages, ScrollText,
} from "lucide-react";

const ICONS = { Atom, FlaskConical, Sigma, Dna, Cpu, BookOpen, Languages, ScrollText };

const Cell = ({ children, className = "" }) => (
  <td className={`border border-slate-300 px-2 py-1.5 text-center text-xs text-slate-700 ${className}`}>{children}</td>
);

export default function Blueprint() {
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
  const hoursTotal = bp ? bp.rows.reduce((s, r) => s + r.hours, 0) : 0;
  const marksTotal = bp ? bp.rows.reduce((s, r) => s + r.marks, 0) : 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header showBack title={subject?.name} Icon={Icon} bgClass={accent.icon} />

      <main className="mx-auto max-w-5xl px-4 py-8 md:px-8">
        {bp ? (
        <>
        <div data-testid="blueprint-table" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
          <div className="mb-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Government of Karnataka</p>
            <h1 className="mt-1 text-lg font-extrabold tracking-tight text-slate-900 md:text-xl">
              {bp.name} 2026-27 — Blueprint for Model Papers
            </h1>
            <p className="mt-1 text-xs text-slate-500">Subject: {bp.code} - {bp.name} · II PUC Blue Print · Max Marks: {bp.maxMarks}</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 px-2 py-2 text-xs font-bold text-slate-700">Unit</th>
                  <th className="border border-slate-300 px-2 py-2 text-xs font-bold text-slate-700">Ch</th>
                  <th className="border border-slate-300 px-2 py-2 text-left text-xs font-bold text-slate-700">Chapter</th>
                  <th className="border border-slate-300 px-2 py-2 text-xs font-bold text-slate-700">Teaching Hours</th>
                  <th className="border border-slate-300 px-2 py-2 text-xs font-bold text-slate-700">Marks</th>
                  {bp.parts.map((p) => (
                    <th key={p.key} className="border border-slate-300 px-2 py-2 text-xs font-bold text-slate-700">
                      <div>PART-{p.label || p.key}</div>
                      <div className="text-[10px] font-medium text-slate-500">{p.mark} Mark</div>
                      <div className="text-[10px] font-normal text-slate-400">No of Qs {p.qs}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bp.rows.map((r, i) => (
                  <tr key={r.ch} className={i % 2 ? "bg-slate-50/60" : "bg-white"}>
                    <Cell className="font-semibold">{r.unit}</Cell>
                    <Cell>{r.ch}</Cell>
                    <td className="border border-slate-300 px-2 py-1.5 text-left text-xs font-medium text-slate-800">{r.chapter}</td>
                    <Cell>{r.hours}</Cell>
                    <Cell className="font-bold text-slate-900">{r.marks}</Cell>
                    {bp.parts.map((p) => (
                      <Cell key={p.key} className={r.vals[p.key] ? `font-semibold ${MARK_COLORS[p.mark].cell}` : ""}>
                        {r.vals[p.key]}
                      </Cell>
                    ))}
                  </tr>
                ))}
                {/* Totals — number of questions */}
                <tr className="bg-slate-100 font-bold">
                  <td className="border border-slate-300 px-2 py-2 text-center text-xs text-slate-800" colSpan={3}>TOTAL — No. of Questions</td>
                  <td className="border border-slate-300 px-2 py-2 text-center text-xs text-slate-900">{hoursTotal}</td>
                  <td className="border border-slate-300 px-2 py-2 text-center text-xs text-slate-900">{marksTotal}</td>
                  {bp.parts.map((p) => <Cell key={p.key} className="font-bold">{p.qCount}</Cell>)}
                </tr>
                {/* Totals — marks */}
                <tr className="bg-slate-100 font-bold">
                  <td className="border border-slate-300 px-2 py-2 text-center text-xs text-slate-800" colSpan={5}>Marks</td>
                  {bp.parts.map((p) => <Cell key={p.key} className="font-bold">{p.mCount}</Cell>)}
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[11px] text-slate-400">
            Read as answered/total. Students attempt {bp.maxMarks} marks with internal choices.
          </p>
        </div>
        </>
        ) : (
          <div data-testid="blueprint-empty" className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
            <p className="text-sm font-semibold text-slate-600">Blueprint coming soon for {subject?.name}</p>
            <p className="mt-1 text-xs text-slate-400">The detailed marks blueprint for this subject is being prepared.</p>
          </div>
        )}
      </main>
    </div>
  );
}
