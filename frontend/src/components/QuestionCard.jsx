import React, { useState } from "react";
import { ChevronDown, Eye, EyeOff, Pencil, Trash2, CheckCircle2, XCircle, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DIFFICULTY_COLORS, PATTERN_META } from "@/lib/theme";
import { useTeacher } from "@/context/TeacherContext";

export const QuestionCard = ({ q, index, onEdit, onDelete }) => {
  const { teacherMode } = useTeacher();
  const [showSolution, setShowSolution] = useState(false);
  const [selected, setSelected] = useState(null);
  const [fbkValue, setFbkValue] = useState("");
  const [fbkChecked, setFbkChecked] = useState(false);

  const meta = PATTERN_META[q.pattern] || {};
  const isMcq = q.pattern === "mcq";
  const isFbk = q.pattern === "fbk";

  const fbkCorrect =
    fbkChecked && fbkValue.trim().toLowerCase() === (q.answer || "").trim().toLowerCase();

  return (
    <div
      data-testid={`question-card-${q.id}`}
      className="animate-fade-up rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-md border px-2 py-0.5 text-[11px] font-bold ${meta.bg} ${meta.color}`}>
          {meta.label}
        </span>
        <Badge variant="outline" className="border-slate-200 text-slate-600">{q.chapter}</Badge>
        <span className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${DIFFICULTY_COLORS[q.difficulty] || ""}`}>
          {q.difficulty}
        </span>
        <span className="ml-auto text-xs font-semibold text-slate-400">Q{index + 1} · {q.marks}M</span>
      </div>

      <p className="mt-3 text-[15px] font-medium leading-relaxed text-slate-900">{q.question}</p>

      {isMcq && (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {q.options.map((opt, i) => {
            const isCorrect = opt === q.answer;
            const isPicked = selected === i;
            let cls = "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/40";
            if (selected !== null) {
              if (isCorrect) cls = "border-emerald-300 bg-emerald-50";
              else if (isPicked) cls = "border-rose-300 bg-rose-50";
              else cls = "border-slate-200 bg-white opacity-70";
            }
            return (
              <button
                key={i}
                data-testid={`mcq-option-${q.id}-${i}`}
                onClick={() => setSelected(i)}
                className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm transition-all ${cls}`}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-xs font-bold text-slate-600">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="text-slate-700">{opt}</span>
                {selected !== null && isCorrect && <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-600" />}
                {selected !== null && isPicked && !isCorrect && <XCircle className="ml-auto h-4 w-4 text-rose-500" />}
              </button>
            );
          })}
        </div>
      )}

      {isFbk && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Input
            data-testid={`fbk-input-${q.id}`}
            value={fbkValue}
            onChange={(e) => { setFbkValue(e.target.value); setFbkChecked(false); }}
            placeholder="Type your answer…"
            className="max-w-xs"
          />
          <Button
            data-testid={`fbk-check-${q.id}`}
            variant="outline"
            onClick={() => setFbkChecked(true)}
            disabled={!fbkValue.trim()}
          >
            Check
          </Button>
          {fbkChecked && (
            <span className={`flex items-center gap-1 text-sm font-semibold ${fbkCorrect ? "text-emerald-600" : "text-rose-500"}`}>
              {fbkCorrect ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              {fbkCorrect ? "Correct!" : `Answer: ${q.answer}`}
            </span>
          )}
        </div>
      )}

      <div className="mt-4 flex items-center gap-2">
        <button
          data-testid={`toggle-solution-btn-${q.id}`}
          onClick={() => setShowSolution((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-slate-700"
        >
          {showSolution ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {showSolution ? "Hide" : "Marking Scheme & Solution"}
        </button>

        {teacherMode && (
          <>
            <button
              data-testid={`edit-question-${q.id}`}
              onClick={() => onEdit(q)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit
            </button>
            <button
              data-testid={`delete-question-${q.id}`}
              onClick={() => onDelete(q)}
              className="flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </>
        )}
      </div>

      {showSolution && (
        <div className="mt-3 space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
          {(isMcq || isFbk) && q.answer && (
            <p className="text-sm">
              <span className="font-semibold text-emerald-700">Answer: </span>
              <span className="text-slate-700">{q.answer}</span>
            </p>
          )}
          <p className="text-sm leading-relaxed text-slate-700">{q.solution}</p>
          {q.teacher_note && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p className="text-xs text-amber-800">{q.teacher_note}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
