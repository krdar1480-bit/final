import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { toast } from "sonner";
import {
  Info, BarChart3, FileText, ChevronRight,
  Atom, FlaskConical, Sigma, Dna, GraduationCap, Stethoscope,
} from "lucide-react";

const EXAMS = {
  kcet: {
    name: "KCET",
    accent: "bg-emerald-600",
    Icon: FlaskConical,
    subjects: [
      { id: "physics", label: "Physics", icon: Atom, dot: "bg-blue-600" },
      { id: "chemistry", label: "Chemistry", icon: FlaskConical, dot: "bg-emerald-600" },
      { id: "math", label: "Mathematics", icon: Sigma, dot: "bg-violet-600" },
      { id: "biology", label: "Biology", icon: Dna, dot: "bg-rose-600" },
    ],
  },
  neet: {
    name: "NEET",
    accent: "bg-rose-600",
    Icon: Stethoscope,
    subjects: [
      { id: "physics", label: "Physics", icon: Atom, dot: "bg-blue-600" },
      { id: "chemistry", label: "Chemistry", icon: FlaskConical, dot: "bg-emerald-600" },
      { id: "biology", label: "Biology", icon: Dna, dot: "bg-rose-600" },
    ],
  },
  "jee-main": {
    name: "JEE Main's",
    accent: "bg-violet-600",
    Icon: Sigma,
    subjects: [
      { id: "physics", label: "Physics", icon: Atom, dot: "bg-blue-600" },
      { id: "chemistry", label: "Chemistry", icon: FlaskConical, dot: "bg-emerald-600" },
      { id: "math", label: "Mathematics", icon: Sigma, dot: "bg-violet-600" },
    ],
  },
  "jee-adv": {
    name: "JEE Advance",
    accent: "bg-amber-600",
    Icon: Atom,
    subjects: [
      { id: "physics", label: "Physics", icon: Atom, dot: "bg-blue-600" },
      { id: "chemistry", label: "Chemistry", icon: FlaskConical, dot: "bg-emerald-600" },
      { id: "math", label: "Mathematics", icon: Sigma, dot: "bg-violet-600" },
    ],
  },
};

export default function ExamDashboard() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const exam = EXAMS[examId];
  const soon = (what) =>
    toast(`${what} — Coming soon`, { description: "Content will be added shortly." });

  if (!exam) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <Header showBack title="Exam" Icon={GraduationCap} bgClass="bg-slate-700" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header showBack title={exam.name} Icon={exam.Icon} bgClass={exam.accent} />

      <main className="mx-auto max-w-2xl space-y-4 px-4 py-8 md:px-6">
        {/* Exam Info + Analytics — stacked top pills */}
        <div className="space-y-3">
          <button
            data-testid="exam-info-pill"
            onClick={() => soon("Exam Info")}
            className="group flex w-full items-center gap-2.5 rounded-xl bg-slate-800 px-4 py-3 shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
            <Info className="h-4 w-4 text-slate-300" />
            <span className="text-sm font-bold text-white">Exam Info</span>
            <ChevronRight className="ml-auto h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1" />
          </button>
          <button
            data-testid="exam-analytics-pill"
            onClick={() => soon("Analytics")}
            className="group flex w-full items-center gap-2.5 rounded-xl bg-indigo-900 px-4 py-3 shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
            <BarChart3 className="h-4 w-4 text-indigo-200" />
            <span className="text-sm font-bold text-white">Analytics</span>
            <ChevronRight className="ml-auto h-4 w-4 text-indigo-300 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {/* Subjects — grouped inside a rounded bracket box (like the sketch) */}
        <div className="relative mt-4">
          <div className="absolute -left-4 top-0 h-0.5 w-4 rounded-full bg-slate-400" />
          <div className="absolute -left-4 bottom-0 h-0.5 w-4 rounded-full bg-slate-400" />

          <div className="rounded-r-3xl border-y-2 border-r-2 border-slate-400 py-3 pl-1 pr-6">
            <div data-testid="exam-subjects" className="space-y-2.5">
              {exam.subjects.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    data-testid={`exam-subject-${s.id}`}
                    onClick={() => navigate(`/exam/${examId}/${s.id}/chapters`)}
                    className="group flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                  >
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white ${s.dot}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-extrabold text-slate-900">{s.label}</span>
                    <ChevronRight className="ml-auto h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-slate-900" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Full Paper — bottom pill */}
        <button
          data-testid="exam-full-paper-pill"
          onClick={() => (examId === "neet" || examId === "kcet" ? navigate(`/exam/${examId}/papers`) : soon("Full Paper"))}
          className="group flex w-full items-center gap-2.5 rounded-xl bg-[#5B50E6] px-4 py-3 shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
        >
          <FileText className="h-4 w-4 text-indigo-100" />
          <span className="text-sm font-bold text-white">Full Paper</span>
          <ChevronRight className="ml-auto h-4 w-4 text-indigo-100 transition-transform group-hover:translate-x-1" />
        </button>
      </main>
    </div>
  );
}
