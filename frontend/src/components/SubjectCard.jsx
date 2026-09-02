import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Atom, FlaskConical, Sigma, Dna, Cpu, BookOpen, Languages, ScrollText, ArrowRight, Lock,
} from "lucide-react";
import { ACCENTS } from "@/lib/theme";

const ICONS = { Atom, FlaskConical, Sigma, Dna, Cpu, BookOpen, Languages, ScrollText };

const TRIAL_IDS = ["physics", "chemistry", "math"];

export const SubjectCard = ({ subject, index }) => {
  const navigate = useNavigate();
  const accent = ACCENTS[subject.accent] || ACCENTS.physics;
  const Icon = ICONS[subject.icon] || Atom;
  const isTrial = TRIAL_IDS.includes(subject.id);

  return (
    <button
      data-testid={`subject-card-${subject.id}`}
      onClick={() => navigate(`/subject/${subject.id}`)}
      style={{ animationDelay: `${index * 60}ms` }}
      className="animate-fade-up group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/60"
    >
      {/* top-right status: Trial badge or lock symbol */}
      <div className="absolute right-3 top-3 z-10">
        {isTrial ? (
          <span
            data-testid={`subject-trial-${subject.id}`}
            className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700"
          >
            Trial
          </span>
        ) : (
          <span
            data-testid={`subject-lock-${subject.id}`}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-red-600"
          >
            <Lock className="h-3.5 w-3.5" />
          </span>
        )}
      </div>

      <div
        className={`absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br ${accent.grad} opacity-[0.07] transition-transform duration-500 group-hover:scale-150`}
      />

      <div className="flex items-center gap-2.5">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${accent.icon} text-white shadow-md`}>
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-base font-bold tracking-tight text-slate-900">{subject.name}</h3>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] font-medium text-slate-500">
        <span>Subject Code {subject.code}</span>
        <span>{subject.chapters} Chapters</span>
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition-colors group-hover:text-slate-900">
        View Full Analytics
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
      </div>
    </button>
  );
};
