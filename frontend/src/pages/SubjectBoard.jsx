import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getSubjects } from "@/lib/api";
import { Header } from "@/components/Header";
import { SubjectCard } from "@/components/SubjectCard";
import { BookMarked } from "lucide-react";

export default function SubjectBoard() {
  const { data: subjects = [], isLoading } = useQuery({
    queryKey: ["subjects"],
    queryFn: getSubjects,
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header showBack title="2nd PUC Karnataka Board" />

      <main className="mx-auto max-w-7xl px-4 py-10 md:px-8">
        <div className="mb-6 flex items-center gap-2">
          <BookMarked className="h-5 w-5 text-slate-700" />
          <h2 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
            Choose a Subject
          </h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="h-52 animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
            ))}
          </div>
        ) : (
          <div
            data-testid="subject-board-grid"
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {subjects.map((s, i) => (
              <SubjectCard key={s.id} subject={s} index={i} />
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        Karnataka Board Exam Pattern & Analytics · Study smarter, not harder
      </footer>
    </div>
  );
}
