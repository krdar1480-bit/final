import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { toast } from "sonner";
import { Stethoscope, FlaskConical, FileText, Lock, BarChart3, ArrowRight } from "lucide-react";

const EXAM_META = {
  neet: { name: "NEET", Icon: Stethoscope, langs: ["English", "हिन्दी"] },
  kcet: { name: "KCET", Icon: FlaskConical, langs: ["English"] },
};

const PAPERS_BY_EXAM = {
  neet: [
    { year: 2026, items: [
      { name: "RE-NEET 2026", date: "21st June 2026 at 2:00 PM", quiz: "reexam-2026", solutions: "reexam-2026" },
      { name: "NEET 2026", date: "3rd May 2026 at 2:00 PM" },
    ] },
    { year: 2025, items: [{ name: "NEET 2025", date: "4th May 2025 at 2:00 PM" }] },
    { year: 2024, items: [
      { name: "NEET 2024 (Re-Examination)", date: "24th June 2024 at 2:00 PM" },
      { name: "NEET 2024", date: "5th May 2024 at 2:00 PM" },
    ] },
    { year: 2023, items: [
      { name: "NEET 2023 Manipur", date: "6th June 2023 at 10:00 AM" },
      { name: "NEET 2023", date: "7th May 2023 at 10:00 AM" },
    ] },
    { year: 2022, items: [
      { name: "NEET 2022 Phase 2", date: "4th September 2022 at 10:00 AM" },
      { name: "NEET 2022 Phase 1", date: "17th July 2022 at 10:00 AM" },
    ] },
    { year: 2021, items: [{ name: "NEET 2021", date: "12th September 2021 at 2:00 PM" }] },
    { year: 2020, items: [{ name: "NEET 2020 Phase 1", date: "13th September 2020 at 2:00 PM" }] },
    { year: 2019, items: [{ name: "NEET 2019", date: "5th May 2019 at 2:00 PM" }] },
    { year: 2018, items: [{ name: "NEET 2018", date: "6th May 2018 at 10:00 AM" }] },
    { year: 2017, items: [{ name: "NEET 2017", date: "7th May 2017 at 10:00 AM" }] },
    { year: 2016, items: [
      { name: "NEET 2016 Phase 2", date: "24th July 2016 at 10:00 AM" },
      { name: "NEET 2016 Phase 1", date: "1st May 2016 at 10:00 AM" },
    ] },
    { year: 2015, items: [
      { name: "AIPMT 2015", date: "25th July 2015 at 10:00 AM" },
      { name: "AIPMT 2015 Cancelled Paper", date: "3rd May 2015 at 10:00 AM" },
    ] },
    { year: 2014, items: [{ name: "AIPMT 2014", date: "4th May 2014 at 10:00 AM" }] },
    { year: 2013, items: [
      { name: "NEET 2013 (Karnataka)", date: "18th May 2013 at 3:30 PM" },
      { name: "NEET 2013", date: "5th May 2013 at 3:30 PM" },
    ] },
    { year: 2012, items: [
      { name: "AIPMT 2012 Mains", date: "13th April 2012 at 3:30 PM" },
      { name: "AIPMT 2012 Prelims", date: "1st April 2012 at 3:30 PM" },
    ] },
    { year: 2011, items: [
      { name: "AIPMT 2011 Mains", date: "15th May 2011 at 3:30 PM" },
      { name: "AIPMT 2011 Prelims", date: "3rd April 2011 at 3:30 PM" },
    ] },
    { year: 2010, items: [
      { name: "AIPMT 2010 Mains", date: "16th May 2010 at 3:30 PM" },
      { name: "AIPMT 2010 Prelims", date: "3rd April 2010 at 3:30 PM" },
    ] },
    { year: 2009, items: [{ name: "AIPMT 2009", date: "10th May 2009 at 3:30 PM" }] },
    { year: 2008, items: [{ name: "AIPMT 2008", date: "11th May 2008 at 3:30 PM" }] },
    { year: 2007, items: [{ name: "AIPMT 2007", date: "6th May 2007 at 3:30 PM" }] },
    { year: 2006, items: [{ name: "AIPMT 2006", date: "7th May 2006 at 3:30 PM" }] },
    { year: 2005, items: [{ name: "AIPMT 2005", date: "1st May 2005 at 3:30 PM" }] },
    { year: 2004, items: [{ name: "AIPMT 2004", date: "2nd May 2004 at 3:30 PM" }] },
    { year: 2003, items: [{ name: "AIPMT 2003", date: "4th May 2003 at 3:30 PM" }] },
    { year: 2002, items: [{ name: "AIPMT 2002", date: "5th May 2002 at 3:30 PM" }] },
    { year: 2001, items: [{ name: "AIPMT 2001", date: "6th May 2001 at 3:30 PM" }] },
    { year: 2000, items: [{ name: "AIPMT 2000", date: "7th May 2000 at 3:30 PM" }] },
  ],
  kcet: [
    { year: 2026, items: [{ name: "KCET 2026", date: "23rd April 2026 at 10:30 AM" }] },
    { year: 2025, items: [{ name: "KCET 2025", date: "16th April 2025 at 10:30 AM" }] },
    { year: 2024, items: [{ name: "KCET 2024", date: "18th April 2024 at 10:30 AM" }] },
    { year: 2023, items: [{ name: "KCET 2023", date: "20th May 2023 at 10:30 AM" }] },
    { year: 2022, items: [{ name: "KCET 2022", date: "16th June 2022 at 10:00 AM" }] },
    { year: 2021, items: [{ name: "KCET 2021", date: "20th May 2021 at 10:00 AM" }] },
    { year: 2020, items: [{ name: "KCET 2020", date: "30th July 2020 at 10:00 AM" }] },
    { year: 2019, items: [{ name: "KCET 2019", date: "30th April 2019 at 10:00 AM" }] },
    { year: 2018, items: [{ name: "KCET 2018", date: "30th April 2018 at 10:00 AM" }] },
    { year: 2017, items: [{ name: "KCET 2017", date: "2nd May 2017 at 10:30 AM" }] },
  ],
};

export default function ExamPapers() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const meta = EXAM_META[examId] || EXAM_META.neet;
  const Icon = meta.Icon;
  const papers = PAPERS_BY_EXAM[examId] || [];
  const [activeYear, setActiveYear] = useState("all");
  const soon = () => toast("Coming soon", { description: "Papers will be added shortly." });

  const groups = activeYear === "all" ? papers : papers.filter((g) => g.year === activeYear);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header showBack title={meta.name} Icon={Icon} bgClass="bg-[#5B50E6]" />

      <main className="mx-auto max-w-2xl px-4 py-6 md:px-6">
        <h1 className="mb-4 text-lg font-extrabold tracking-tight text-slate-900">Previous Year Question Papers</h1>

        <div className="mb-5 flex gap-2 overflow-x-auto pb-2">
          <button
            data-testid="year-chip-all"
            onClick={() => setActiveYear("all")}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-bold transition-all ${
              activeYear === "all" ? "bg-[#5B50E6] text-white" : "border border-slate-200 bg-white text-slate-600"
            }`}
          >
            All Years
          </button>
          {papers.map((g) => (
            <button
              key={g.year}
              data-testid={`year-chip-${g.year}`}
              onClick={() => setActiveYear(g.year)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-bold transition-all ${
                activeYear === g.year ? "bg-[#5B50E6] text-white" : "border border-slate-200 bg-white text-slate-600"
              }`}
            >
              {g.year}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          {groups.map((g) => {
            const locked = g.year <= 2023;
            return (
            <section key={g.year} data-testid={`year-group-${g.year}`}>
              <h2 className="mb-2.5 text-sm font-extrabold text-slate-500">{g.year}</h2>
              <div className="space-y-3">
                {g.items.map((p, i) => (
                  <div
                    key={i}
                    data-testid={`paper-${g.year}-${i}`}
                    data-locked={locked ? "true" : "false"}
                    className={`rounded-xl border border-slate-200 p-4 shadow-sm ${locked ? "bg-slate-50" : "bg-white"}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${locked ? "bg-slate-100 text-slate-400" : "bg-indigo-50 text-[#5B50E6]"}`}>
                        <FileText className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-extrabold ${locked ? "text-slate-400" : "text-slate-900"}`}>{p.name}</p>
                        <p className="text-xs text-slate-500">{p.date}</p>
                        <div className="mt-1.5 flex gap-1.5">
                          {meta.langs.map((l) => (
                            <span key={l} className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{l}</span>
                          ))}
                        </div>
                      </div>
                      {locked && (
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-500 ring-1 ring-rose-100">
                          <Lock className="h-4 w-4" />
                        </span>
                      )}
                    </div>
                    {!locked && (
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => p.quiz ? navigate(`/exam/${examId}/quiz/${p.quiz}`) : soon()}
                          className="flex-1 rounded-lg bg-[#5B50E6] py-2 text-sm font-bold text-white transition-all hover:bg-[#4a41c9]"
                        >
                          Take Test
                        </button>
                        {p.solutions ? (
                          <button
                            onClick={() => navigate(`/exam/${examId}/paper/${p.solutions}/solutions`)}
                            className="flex-1 rounded-lg border border-indigo-200 bg-indigo-50 py-2 text-sm font-bold text-[#5B50E6] transition-all hover:bg-indigo-100"
                          >
                            View Solutions
                          </button>
                        ) : (
                          <button
                            onClick={soon}
                            className="flex-1 rounded-lg border border-indigo-200 bg-indigo-50 py-2 text-sm font-bold text-[#5B50E6] transition-all hover:bg-indigo-100"
                          >
                            Practice
                          </button>
                        )}
                      </div>
                    )}
                    <div className="mt-2">
                      <button
                        data-testid={`analytics-${g.year}-${i}`}
                        onClick={soon}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#312E81] py-2 text-sm font-bold text-white transition-all hover:bg-[#3730A3]"
                      >
                        <BarChart3 className="h-4 w-4" />
                        Analytics
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}
