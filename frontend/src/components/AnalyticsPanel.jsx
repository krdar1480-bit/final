import React from "react";
import { Clock, Award } from "lucide-react";

const KpiCard = ({ icon: Icon, label, value, sub, tone }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${tone}`}>
        <Icon className="h-4 w-4" />
      </div>
    </div>
    <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">{value}</p>
    <p className="mt-1 text-xs text-slate-500">{sub}</p>
  </div>
);

export const AnalyticsPanel = ({ analytics }) => {
  return (
    <div data-testid="subject-analytics-dashboard" className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* KPIs on one side */}
      <div className="space-y-4 lg:col-span-4">
        <KpiCard icon={Award} label="Total Marks" value={analytics.total_marks}
          sub={`${analytics.theory_marks} theory + ${analytics.practical_marks} practical`}
          tone="bg-blue-50 text-blue-600" />
        <KpiCard icon={Clock} label="Duration" value={analytics.duration.split(" ")[0] + "h"}
          sub={analytics.duration} tone="bg-amber-50 text-amber-600" />
      </div>

      {/* Section allocation fills the freed space */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-8">
        <h3 className="text-base font-bold text-slate-900">Sectional Mark Allocation</h3>
        <p className="mb-4 text-xs text-slate-500">Paper structure breakdown</p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {analytics.sections.map((s) => (
            <div key={s.part} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-sm font-bold text-slate-900">{s.part}</p>
              <p className="text-xs text-slate-500">{s.detail}</p>
              <div className="mt-3 flex items-end justify-between">
                <div>
                  <p className="text-2xl font-extrabold text-slate-900">{s.marks}</p>
                  <p className="text-[11px] text-slate-500">marks</p>
                </div>
                <span className="rounded-md bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 shadow-sm">
                  {s.questions} Qs
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
