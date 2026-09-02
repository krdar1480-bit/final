import React, { useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSubject, getQuestions } from "@/lib/api";
import { Header } from "@/components/Header";
import { QuestionCard } from "@/components/QuestionCard";
import { SubscriptionPaywall } from "@/components/SubscriptionPaywall";
import { ACCENTS } from "@/lib/theme";
import { BLUEPRINTS, MARK_TO_PART } from "@/lib/blueprints";
import { FileText, BarChart3, ChevronRight, FileQuestion, Lock } from "lucide-react";

// Trial subjects use freemium locking on the pattern pages.
const TRIAL_SUBJECTS = ["physics", "chemistry", "math"];
// MCQ & FBK -> only the first group is free (rest locked). Other patterns keep the
// per-pattern free counts below.
const FREE_COUNT = {
  physics: { "2m": 3, "3m": 3, "5m": 2 },
  chemistry: { "2m": 2, "3m-inorg": 2, "3m-phys": 2, "5m-org": 2, "numeric": 2 },
  math: { "2m": 3, "3m": 3, "5m": 3 },
};
// Maths Part VI (6+4M) — only these two chapter options are unlocked; the OR alternatives lock.
const MATH_6P4_FREE = ["Linear Programming", "Determinants"];

// Map chapter name -> chapter number (Karnataka II PUC Physics)
const CHAPTER_NO = {
  "Electrostatics": 1,
  "Electrostatic Potential and Capacitance": 2,
  "Current Electricity": 3,
  "Moving Charges and Magnetism": 4,
  "Magnetism": 5,
  "Magnetism and Matter": 5,
  "Electromagnetic Induction": 6,
  "EMI & AC": 6,
  "Alternating Current": 7,
  "EM Waves": 8,
  "Electromagnetic Waves": 8,
  "Optics": 9,
  "Ray Optics": 9,
  "Wave Optics": 10,
  "Dual Nature": 11,
  "Atoms & Nuclei": 12,
  "Atoms": 12,
  "Nuclei": 13,
  "Semiconductors": 14,
};

const RANGE_GROUPS = {
  physics: [
    { key: "1-5", label: "CH 1 to CH 5", min: 1, max: 5 },
    { key: "6-10", label: "CH 6 to CH 10", min: 6, max: 10 },
    { key: "11-14", label: "CH 11 to CH 14", min: 11, max: 14 },
  ],
  chemistry: [
    { key: "1-3", label: "CH 1 to CH 3", note: "Physical", min: 1, max: 3 },
    { key: "4-5", label: "CH 4 to CH 5", note: "Inorganic", min: 4, max: 5 },
    { key: "6-10", label: "CH 6 to CH 10", note: "Organic", min: 6, max: 10 },
  ],
  math: [
    { key: "1-4", label: "CH 1 to CH 4", min: 1, max: 4 },
    { key: "5-8", label: "CH 5 to CH 8", min: 5, max: 8 },
    { key: "9-13", label: "CH 9 to CH 13", min: 9, max: 13 },
  ],
};

// Maths — explicit chapter list with question numbers per part (from official MQP order)
const MATH_CHAPTERS = {
  "2m": [
    { q: 21, label: "Inverse Trigonometric Functions" },
    { q: 22, label: "Determinants" },
    { q: 23, label: "Continuity & Differentiability" },
    { q: 24, label: "Application of Derivatives" },
    { q: 25, label: "Integrals" },
    { q: 26, label: "Differential Equations" },
    { q: 27, label: "Vector Algebra" },
    { q: 28, label: "Three Dimensional Geometry" },
    { q: 29, label: "Probability" },
  ],
  "3m": [
    { q: 30, label: "Relations and Functions" },
    { q: 31, label: "Inverse Trigonometric Functions" },
    { q: 32, label: "Matrices" },
    { q: 33, label: "Continuity & Differentiability" },
    { q: 34, label: "Application of Derivatives" },
    { q: 35, label: "Integrals" },
    { q: 36, label: "Vector Algebra" },
    { q: 37, label: "Three Dimensional Geometry" },
    { q: 38, label: "Probability" },
  ],
  "5m": [
    { q: 39, label: "Relations and Functions" },
    { q: 40, label: "Matrices" },
    { q: 41, label: "Determinants" },
    { q: 42, label: "Continuity & Differentiability" },
    { q: 43, label: "Integrals" },
    { q: 44, label: "Application of Integrals" },
    { q: 45, label: "Differential Equations" },
  ],
  "6p4m": [
    { q: 46, options: ["Linear Programming", "Integrals"], note: "6m" },
    { q: 47, options: ["Determinants", "Continuity & Differentiability"], note: "4m" },
  ],
};

// Physics — explicit chapter list with question numbers per Part (from official MQP order)
const PHYSICS_CHAPTERS = {
  "2m": [
    { q: 21, label: "Electric Charges & Fields" },
    { q: 22, label: "Electrostatic Potential & Capacitance" },
    { q: 23, label: "Current Electricity" },
    { q: 24, label: "Moving Charges & Magnetism" },
    { q: 25, label: "Electromagnetic Induction" },
    { q: 26, label: "Electromagnetic Waves" },
    { q: 27, label: "Atoms" },
    { q: 28, label: "Semiconductor Electronics" },
  ],
  "3m": [
    { q: 29, label: "Electric Charges & Fields" },
    { q: 30, label: "Electrostatic Potential & Capacitance" },
    { q: 31, label: "Moving Charges & Magnetism" },
    { q: 32, label: "Magnetism & Matter" },
    { q: 33, label: "Electromagnetic Induction" },
    { q: 34, label: "Ray Optics and Optical Instruments" },
    { q: 35, label: "Dual Nature of Radiation" },
    { q: 36, label: "Nuclei" },
  ],
  "5m": [
    { q: 37, options: ["Electric Charges & Fields", "Electrostatic Potential & Capacitance"] },
    { q: 38, label: "Current Electricity" },
    { q: 39, label: "Moving Charges & Magnetism" },
    { q: 40, options: ["Ray Optics", "Wave Optics"] },
    { q: 41, label: "Semiconductor Electronics" },
  ],
  "numeric": [
    { q: 42, options: ["Electric Charges & Fields", "Electrostatic Potential & Capacitance"] },
    { q: 43, label: "Current Electricity" },
    { q: 44, label: "Alternating Current" },
    { q: 45, options: ["Ray Optics", "Wave Optics"] },
  ],
};

// Chemistry — explicit chapter list with question numbers per Part (from official MQP order)
const CHEMISTRY_CHAPTERS = {
  "2m": [
    { q: 21, label: "Chemical Kinetics" },
    { q: 22, label: "d & f Block Elements" },
    { q: 23, label: "Haloalkanes & Haloarenes" },
    { q: 24, label: "Alcohols, Phenols & Ethers" },
    { q: 25, label: "Biomolecules" },
  ],
  "3m-inorg": [
    { q: 26, label: "d & f Block Elements" },
    { q: 27, label: "d & f Block Elements" },
    { q: 28, label: "Coordination Compounds" },
    { q: 29, label: "Coordination Compounds" },
    { q: 30, label: "Coordination Compounds" },
  ],
  "3m-phys": [
    { q: 31, label: "Solutions" },
    { q: 32, label: "Electrochemistry" },
    { q: 33, label: "Electrochemistry" },
    { q: 34, label: "Chemical Kinetics" },
  ],
  "5m-org": [
    { q: 35, label: "Haloalkanes & Haloarenes" },
    { q: 36, label: "Alcohols, Phenols & Ethers" },
    { q: 37, label: "Aldehydes, Ketones & Carboxylic Acids" },
    { q: 38, label: "Aldehydes, Ketones & Carboxylic Acids" },
    { q: 39, label: "Amines" },
    { q: 40, label: "Biomolecules" },
  ],
  "numeric": [
    { q: 41, label: "Solutions" },
    { q: 42, label: "Solutions" },
    { q: 43, label: "Electrochemistry" },
    { q: 44, label: "Electrochemistry" },
    { q: 45, label: "Chemical Kinetics" },
    { q: 46, label: "Chemical Kinetics" },
  ],
};

export default function QuestionPatterns() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const [selectedKey, setSelectedKey] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const needsSub = ["biology", "cs", "english", "kannada"].includes(subjectId);
  const goSub = (path) => (needsSub ? setShowPaywall(true) : navigate(path));

  const { data: subject } = useQuery({
    queryKey: ["subject", subjectId],
    queryFn: () => getSubject(subjectId),
    initialData: () => queryClient.getQueryData(["subjects"])?.find((s) => s.id === subjectId),
    staleTime: 5 * 60 * 1000,
  });
  const patterns = subject?.patterns || [];
  const isPhysics = subjectId === "physics";
  const isKannada = subjectId === "kannada";
  const marksWord = isKannada ? "ಅಂಕ" : "marks";
  const kFont = isKannada ? "font-kannada" : "";
  const accent = ACCENTS[subject?.accent] || ACCENTS.physics;
  const requestedType = searchParams.get("type");
  const activePattern = patterns.some((p) => p.type === requestedType)
    ? requestedType
    : (patterns[0]?.type || "mcq");
  const activeMeta = patterns.find((p) => p.type === activePattern);

  const { data: questions = [] } = useQuery({
    queryKey: ["questions", subjectId, activePattern],
    queryFn: () => getQuestions(subjectId, activePattern),
    enabled: isPhysics,
  });

  // Blueprint-driven chapter list for Physics / Chemistry / Maths.
  // For the active pattern's mark value, list the chapters that carry that Part.
  const bp = BLUEPRINTS[subjectId];
  const partKey = bp && activeMeta ? MARK_TO_PART[activeMeta.each] : null;
  const useBlueprint = !!(bp && partKey);
  const bpPart = useBlueprint ? bp.parts.find((p) => p.key === partKey) : null;
  // "05/08" -> "5/8" (answered / total framed questions for this Part)
  const qCountLabel = bpPart ? bpPart.qCount.split("/").map((x) => parseInt(x, 10)).join("/") : null;
  // Combined expression e.g. "5/8 × 2 = 10"
  const bpEquation = bpPart
    ? `${qCountLabel} × ${bpPart.mark} = ${parseInt(bpPart.qCount.split("/")[0], 10) * parseInt(bpPart.mark, 10)}`
    : null;

  const bpGroups = useBlueprint
    ? bp.rows
        .filter((r) => r.vals[partKey])
        .map((r) => ({ key: r.chapter, label: r.chapter, count: r.vals[partKey], match: (q) => q.chapter === r.chapter }))
    : [];

  // MCQ & FBK -> chapter RANGE groups (Physics/Chemistry/Maths); other tabs -> per-chapter list
  const isMcqFbk = activePattern === "mcq" || activePattern === "fbk";
  const rangeGroups = isMcqFbk && RANGE_GROUPS[subjectId]
    ? RANGE_GROUPS[subjectId].map((r) => ({
        key: r.key, label: r.label, note: r.note, hideCount: true,
        match: (q) => { const n = CHAPTER_NO[q.chapter] || 0; return n >= r.min && n <= r.max; },
      }))
    : null;

  // Maths — explicit chapter list with question numbers for 2M/3M/5M
  const isMath6p4 = subjectId === "math" && activePattern === "6p4m";
  const mathGroups = subjectId === "math" && MATH_CHAPTERS[activePattern] && !isMath6p4
    ? MATH_CHAPTERS[activePattern].map((c) => ({
        key: `q${c.q}`, label: c.label, note: c.note, qno: c.q, hideCount: true, match: () => false,
      }))
    : null;

  // Explicit "question number + chapter" list (Physics 2M/3M/5M/VI, Maths 6+4M).
  // Items may be single {q,label} or an OR choice {q,options:[a,b]}.
  const explicitList = (isPhysics && PHYSICS_CHAPTERS[activePattern])
    || (subjectId === "chemistry" && CHEMISTRY_CHAPTERS[activePattern])
    || (isMath6p4 && MATH_CHAPTERS["6p4m"])
    || null;
  const freeCount = (explicitList && !isMath6p4) ? FREE_COUNT[subjectId]?.[activePattern] : undefined;
  const trialSubject = TRIAL_SUBJECTS.includes(subjectId);
  // Generic groups block: MCQ/FBK free only the first group; Maths 2M/3M/5M use the
  // per-pattern free count; everything else beyond the count is locked.
  const groupFreeCount = isMcqFbk ? 1 : FREE_COUNT[subjectId]?.[activePattern];
  const countFrac = activeMeta?.count && /\bof\b/i.test(activeMeta.count)
    ? activeMeta.count.replace(/\s*of\s*/i, "/")
    : null;
  const markEquation = isMath6p4
    ? "6+4=10m"
    : isMcqFbk
      ? (activeMeta?.equation?.replace(/\s+/g, "") || `${activeMeta?.num}×${activeMeta?.each}=${activeMeta?.total}`)
      : countFrac
        ? `${countFrac}×${activeMeta?.each}=${activeMeta?.total}`
        : (activeMeta?.equation?.replace(/\s+/g, "") || `${activeMeta?.total}m`);

  // Each explicit item becomes selectable group(s): an OR item yields one group
  // per option so BOTH chapters can be tapped separately (keyed by q + option idx).
  const explicitGroups = explicitList
    ? explicitList.flatMap((c) =>
        c.options
          ? c.options.map((o, oi) => ({ key: `${c.q}-${oi}`, label: o, match: (q) => q.chapter === o }))
          : [{ key: `${c.q}`, label: c.label, match: (q) => q.chapter === c.label }]
      )
    : null;

  const groups = rangeGroups || mathGroups || explicitGroups || bpGroups;

  const activeGroup = groups.find((g) => g.key === selectedKey);
  const filtered = activeGroup ? questions.filter(activeGroup.match) : [];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header showBack title={subject?.name} bgClass={accent.icon} />

      <main className="mx-auto max-w-2xl space-y-4 px-4 py-8 md:px-6">
        <div>
          <h1 className={`${kFont} text-xl font-extrabold tracking-tight text-slate-900 md:text-2xl`}>
            {activeMeta?.label} · {activeMeta?.full}
          </h1>
          <p className="text-sm text-slate-500">
            {activeMeta?.children
              ? (isKannada
                  ? `ಒಟ್ಟು ${activeMeta?.total} ಅಂಕ · ವಿಭಾಗದ ವಿವರ`
                  : `Total ${activeMeta?.total} marks · section breakdown`)
              : `Weightage ${activeMeta?.total}m · pick a chapter`}
          </p>
        </div>

        {/* Full Paper + Analytics — dark pills */}
        <div className="space-y-3">
          <button data-testid="full-paper-pill" onClick={() => goSub(`/subject/${subjectId}/papers`)} className="flex w-full items-center gap-2.5 rounded-xl bg-indigo-900 px-4 py-3 shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg">
            <FileText className="h-4 w-4 text-indigo-200" />
            <span className="text-sm font-bold text-white">Full Paper</span>
          </button>
          <button data-testid="analytics-pill" onClick={() => goSub(`/subject/${subjectId}/blueprint`)} className="flex w-full items-center gap-2.5 rounded-xl bg-slate-800 px-4 py-3 shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg">
            <BarChart3 className="h-4 w-4 text-slate-300" />
            <span className="text-sm font-bold text-white">Analytics</span>
          </button>
        </div>

        {/* Kannada (sectioned) — new page showing the section's sub-item breakdown */}
        {activeMeta?.children && (
          <div data-testid="section-breakdown" className="relative mt-4">
            <div className="absolute -left-4 top-0 h-0.5 w-4 rounded-full bg-slate-400" />
            <div className="absolute -left-4 bottom-0 h-0.5 w-4 rounded-full bg-slate-400" />
            <div className="rounded-r-3xl border-y-2 border-r-2 border-slate-400 py-3 pl-1 pr-16">
              <div className="space-y-2.5">
                {activeMeta.children.map((c, ci) => (
                  <button
                    key={ci}
                    type="button"
                    data-testid={`section-item-${ci}`}
                    onClick={() => needsSub && setShowPaywall(true)}
                    className={`flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm ${needsSub ? "transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md" : "cursor-default"}`}
                  >
                    <span className={`${kFont} text-base font-extrabold text-slate-900`}>{c.label}</span>
                    {c.full && <span className="text-xs font-medium text-slate-500">{c.full}</span>}
                    {c.sub && <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">{c.sub}</span>}
                    <span className={`ml-auto rounded-lg px-3 py-1 text-sm font-bold text-white ${accent.icon}`}>
                      {c.equation ? c.equation : `${c.marks}m`}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <span
              className={`absolute right-4 top-1/2 ${kFont} text-base font-extrabold tracking-wide text-slate-900`}
              style={{ writingMode: "vertical-rl", transform: "translateY(-50%) rotate(180deg)" }}
            >
              {activeMeta?.total} {marksWord}
            </span>
          </div>
        )}

        {/* Chapter groups wrapped by a bracket with the marks equation on the right */}
        {!activeMeta?.children && !explicitList && (
        <div className="relative mt-4">
          <div className="absolute -left-4 top-0 h-0.5 w-4 rounded-full bg-slate-400" />
          <div className="absolute -left-4 bottom-0 h-0.5 w-4 rounded-full bg-slate-400" />

          <div className="rounded-r-3xl border-y-2 border-r-2 border-slate-400 py-3 pl-1 pr-16">
            <div className="space-y-2.5">
              {groups.length === 0 && (
                <p className="px-4 py-6 text-center text-sm text-slate-400">No chapters with sample questions yet.</p>
              )}
              {groups.map((g, gi) => {
                const active = selectedKey === g.key;
                const count = g.count != null ? g.count : questions.filter(g.match).length;
                const gLocked = trialSubject && groupFreeCount != null && gi >= groupFreeCount;
                if (gLocked) {
                  return (
                    <div
                      key={g.key}
                      data-testid={`chapter-group-${g.key}`}
                      data-locked="true"
                      className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left shadow-sm"
                    >
                      {g.qno != null && (
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-300 text-[11px] font-bold text-white">{g.qno}</span>
                      )}
                      <span className="text-sm font-extrabold text-slate-400">{g.label}</span>
                      <span className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-500 ring-1 ring-rose-100"><Lock className="h-4 w-4" /></span>
                    </div>
                  );
                }
                return (
                  <button
                    key={g.key}
                    data-testid={`chapter-group-${g.key}`}
                    onClick={() => setSelectedKey(active ? null : g.key)}
                    className={`group flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${
                      active ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white"
                    }`}
                  >
                    {g.qno != null && (
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-900 text-[11px] font-bold text-white">{g.qno}</span>
                    )}
                    <span className={`text-sm font-extrabold ${active ? "text-blue-700" : "text-slate-900"}`}>{g.label}</span>
                    {g.note && (
                      <span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">{g.note}</span>
                    )}
                    {!g.hideCount && (
                      <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                        {count} Qs
                      </span>
                    )}
                    <ChevronRight className={`${g.hideCount ? "ml-auto" : ""} h-4 w-4 transition-transform ${active ? "rotate-90 text-blue-600" : "text-slate-400 group-hover:translate-x-1"}`} />
                  </button>
                );
              })}
            </div>
          </div>

          <span
            data-testid="pattern-total-marks"
            className="absolute right-4 top-1/2 text-base font-extrabold tracking-wide text-slate-900"
            style={{ writingMode: "vertical-rl", transform: "translateY(-50%) rotate(180deg)" }}
          >
            {markEquation}
          </span>
        </div>
        )}

        {/* Explicit "question number + chapter" list (Physics 2M/3M/5M/VI, Chemistry, Maths 6+4M) */}
        {explicitList && (
        <div className="relative mt-4">
          <div className="absolute -left-4 top-0 h-0.5 w-4 rounded-full bg-slate-400" />
          <div className="absolute -left-4 bottom-0 h-0.5 w-4 rounded-full bg-slate-400" />

          <div className="rounded-r-3xl border-y-2 border-r-2 border-slate-400 py-3 pl-1 pr-16">
            <div className="space-y-2.5">
              {explicitList.map((c, ci) => {
                const itemLocked = freeCount != null && ci >= freeCount;
                return c.options ? (
                  <div
                    key={c.q}
                    data-testid={`explicit-q${c.q}`}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-4 shadow-sm ${itemLocked ? "border-slate-200 bg-slate-50" : "border-slate-200 bg-white"}`}
                  >
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${itemLocked ? "bg-slate-300" : "bg-slate-900"}`}>{c.q}</span>
                    <div className="flex flex-1 flex-col items-center gap-1.5">
                      {c.options.map((o, oi) => {
                        const oKey = `${c.q}-${oi}`;
                        const oActive = selectedKey === oKey;
                        const optLocked = isMath6p4 ? !MATH_6P4_FREE.includes(o) : itemLocked;
                        return (
                          <React.Fragment key={oi}>
                            {oi > 0 && <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">OR</span>}
                            {optLocked ? (
                              <div className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center text-sm font-extrabold text-slate-400">
                                {o}
                                <Lock className="h-3.5 w-3.5 text-rose-400" />
                              </div>
                            ) : (
                              <button
                                type="button"
                                data-testid={`explicit-opt-${c.q}-${oi}`}
                                onClick={() => setSelectedKey(oActive ? null : oKey)}
                                className={`w-full rounded-lg border px-3 py-2 text-center text-sm font-extrabold transition-all hover:-translate-y-0.5 hover:shadow-sm ${oActive ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 bg-slate-50 text-slate-900"}`}
                              >
                                {o}
                              </button>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                    {itemLocked ? (
                      <span className="ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-500 ring-1 ring-rose-100"><Lock className="h-4 w-4" /></span>
                    ) : (
                      c.note && <span className={`ml-1 shrink-0 rounded-lg px-3 py-1.5 text-sm font-bold text-white ${accent.icon}`}>{c.note}</span>
                    )}
                  </div>
                ) : itemLocked ? (
                  <div
                    key={c.q}
                    data-testid={`explicit-q${c.q}`}
                    data-locked="true"
                    className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-300 text-[11px] font-bold text-white">{c.q}</span>
                    <span className="text-sm font-extrabold text-slate-400">{c.label}</span>
                    <span className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-500 ring-1 ring-rose-100"><Lock className="h-4 w-4" /></span>
                  </div>
                ) : (
                  (() => {
                    const rActive = selectedKey === `${c.q}`;
                    return (
                      <button
                        key={c.q}
                        type="button"
                        data-testid={`explicit-q${c.q}`}
                        onClick={() => setSelectedKey(rActive ? null : `${c.q}`)}
                        className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${rActive ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white"}`}
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-900 text-[11px] font-bold text-white">{c.q}</span>
                        <span className={`text-sm font-extrabold ${rActive ? "text-blue-700" : "text-slate-900"}`}>{c.label}</span>
                        {c.note && <span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">{c.note}</span>}
                      </button>
                    );
                  })()
                );
              })}
            </div>
          </div>

          <span
            data-testid="pattern-total-marks"
            className="absolute right-4 top-1/2 text-base font-extrabold tracking-wide text-slate-900"
            style={{ writingMode: "vertical-rl", transform: "translateY(-50%) rotate(180deg)" }}
          >
            {markEquation}
          </span>
        </div>
        )}
        {activeGroup && (
          <div data-testid="group-questions" className="space-y-4 pt-2">
            <h2 className="text-sm font-bold text-slate-700">{activeGroup.label} · {activeMeta?.label} Questions</h2>
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-center">
                <FileQuestion className="mb-2 h-8 w-8 text-slate-300" />
                <p className="text-sm font-semibold text-slate-600">No sample questions here yet</p>
              </div>
            ) : (
              filtered.map((q, i) => (
                <QuestionCard key={q.id} q={q} index={i} onEdit={() => {}} onDelete={() => {}} />
              ))
            )}
          </div>
        )}
      </main>

      {showPaywall && (
        <SubscriptionPaywall subjectName={subject?.name} onClose={() => setShowPaywall(false)} />
      )}
    </div>
  );
}
