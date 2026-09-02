import React from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { GraduationCap, FlaskConical, Sigma, Atom, Stethoscope, ArrowRight, Clock } from "lucide-react";

const EXAMS = [
  { id: "puc", label: "2nd PUC Karnataka Board", sub: "+ LAB", icon: GraduationCap, to: "/board", accent: "bg-blue-600", active: true },
  { id: "kcet", label: "KCET", icon: FlaskConical, accent: "bg-emerald-600", active: true, to: "/exam/kcet" },
  { id: "neet", label: "NEET", icon: Stethoscope, accent: "bg-rose-600", active: true, to: "/exam/neet" },
  { id: "jee-main", label: "JEE Main's", icon: Sigma, accent: "bg-violet-600", active: false },
  { id: "jee-adv", label: "JEE Advance", icon: Atom, accent: "bg-amber-600", active: false },
];

export default function ExamHome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header />

      <main className="mx-auto max-w-xl px-4 py-10 md:px-6">
        <div data-testid="exam-list" className="space-y-4">
          {EXAMS.map((e, i) => {
            const Icon = e.icon;
            return (
              <button
                key={e.id}
                data-testid={`exam-card-${e.id}`}
                disabled={!e.active}
                onClick={() => e.active && navigate(e.to)}
                style={{ animationDelay: `${i * 70}ms` }}
                className={`animate-fade-up group flex w-full items-center gap-4 rounded-2xl border bg-white px-5 py-4 text-left shadow-sm transition-all duration-300 ${
                  e.active
                    ? "cursor-pointer border-slate-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg"
                    : "cursor-not-allowed border-slate-200 opacity-70"
                }`}
              >
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${e.accent} text-white shadow-md`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-extrabold tracking-tight text-slate-900">{e.label}</span>
                  {e.sub && <span className="text-xs font-semibold text-slate-500">{e.sub}</span>}
                </div>
                {e.active ? (
                  <ArrowRight className="ml-auto h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-slate-900" />
                ) : (
                  <span className="ml-auto flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-500">
                    <Clock className="h-3 w-3" /> Coming Soon
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}
