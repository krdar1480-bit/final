import React, { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, X } from "lucide-react";

const PATTERN_OPTS = [
  { v: "mcq", l: "MCQ (1M)", m: 1 },
  { v: "fbk", l: "Fill in the Blanks (1M)", m: 1 },
  { v: "2m", l: "2 Mark", m: 2 },
  { v: "3m", l: "3 Mark", m: 3 },
  { v: "5m", l: "5 Mark", m: 5 },
  { v: "numeric", l: "Numeric (5M)", m: 5 },
];
const DIFFICULTY_OPTS = ["Knowledge", "Understanding", "Application", "HOTS"];

const empty = {
  pattern: "mcq", chapter: "", difficulty: "Understanding", marks: 1,
  question: "", options: ["", "", "", ""], answer: "", solution: "", teacher_note: "",
};

export const QuestionFormModal = ({ open, onOpenChange, initial, defaultPattern, onSubmit }) => {
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (open) {
      if (initial) {
        setForm({
          ...empty, ...initial,
          options: initial.options?.length ? initial.options : ["", "", "", ""],
        });
      } else {
        const p = PATTERN_OPTS.find((x) => x.v === (defaultPattern || "mcq"));
        setForm({ ...empty, pattern: p.v, marks: p.m });
      }
    }
  }, [open, initial, defaultPattern]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const onPatternChange = (v) => {
    const p = PATTERN_OPTS.find((x) => x.v === v);
    setForm((f) => ({ ...f, pattern: v, marks: p.m }));
  };

  const setOption = (i, v) =>
    setForm((f) => ({ ...f, options: f.options.map((o, idx) => (idx === i ? v : o)) }));
  const addOption = () => setForm((f) => ({ ...f, options: [...f.options, ""] }));
  const removeOption = (i) =>
    setForm((f) => ({ ...f, options: f.options.filter((_, idx) => idx !== i) }));

  const handleSubmit = () => {
    const payload = { ...form };
    if (form.pattern !== "mcq") payload.options = [];
    else payload.options = form.options.filter((o) => o.trim());
    onSubmit(payload);
  };

  const isMcq = form.pattern === "mcq";
  const valid = form.chapter.trim() && form.question.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="question-form-modal" className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Question" : "Add New Question"}</DialogTitle>
          <DialogDescription>
            Fill the details below to {initial ? "update this" : "create a new"} sample question for students.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Pattern Type</Label>
              <Select value={form.pattern} onValueChange={onPatternChange} disabled={!!initial}>
                <SelectTrigger data-testid="form-pattern-select" className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PATTERN_OPTS.map((p) => <SelectItem key={p.v} value={p.v}>{p.l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Difficulty</Label>
              <Select value={form.difficulty} onValueChange={(v) => set("difficulty", v)}>
                <SelectTrigger data-testid="form-difficulty-select" className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DIFFICULTY_OPTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Chapter</Label>
              <Input data-testid="form-chapter-input" className="mt-1" value={form.chapter}
                onChange={(e) => set("chapter", e.target.value)} placeholder="e.g. Optics" />
            </div>
            <div>
              <Label className="text-xs">Marks</Label>
              <Input type="number" className="mt-1" value={form.marks}
                onChange={(e) => set("marks", parseInt(e.target.value) || 1)} />
            </div>
          </div>

          <div>
            <Label className="text-xs">Question</Label>
            <Textarea data-testid="form-question-input" className="mt-1" rows={3} value={form.question}
              onChange={(e) => set("question", e.target.value)} placeholder="Enter the question text…" />
          </div>

          {isMcq && (
            <div>
              <Label className="text-xs">Options (click set answer)</Label>
              <div className="mt-1 space-y-2">
                {form.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => set("answer", opt)}
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border text-xs font-bold ${
                        opt && form.answer === opt
                          ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 text-slate-500"
                      }`}
                    >
                      {String.fromCharCode(65 + i)}
                    </button>
                    <Input value={opt} onChange={(e) => setOption(i, e.target.value)}
                      placeholder={`Option ${i + 1}`} />
                    {form.options.length > 2 && (
                      <button type="button" onClick={() => removeOption(i)}
                        className="text-slate-400 hover:text-rose-500">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <Button type="button" variant="ghost" size="sm" className="mt-2 gap-1" onClick={addOption}>
                <Plus className="h-3.5 w-3.5" /> Add Option
              </Button>
            </div>
          )}

          {!isMcq && (
            <div>
              <Label className="text-xs">Answer {form.pattern === "fbk" ? "(the blank)" : "(final answer, optional)"}</Label>
              <Input data-testid="form-answer-input" className="mt-1" value={form.answer}
                onChange={(e) => set("answer", e.target.value)} placeholder="Correct answer" />
            </div>
          )}

          <div>
            <Label className="text-xs">Solution / Marking Scheme</Label>
            <Textarea className="mt-1" rows={3} value={form.solution}
              onChange={(e) => set("solution", e.target.value)} placeholder="Step-by-step solution and mark split…" />
          </div>

          <div>
            <Label className="text-xs">Teacher Note (optional)</Label>
            <Input className="mt-1" value={form.teacher_note}
              onChange={(e) => set("teacher_note", e.target.value)} placeholder="Tip for students" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button data-testid="save-question-btn" onClick={handleSubmit} disabled={!valid}>
            {initial ? "Save Changes" : "Add Question"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
