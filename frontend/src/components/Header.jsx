import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { GraduationCap, ArrowLeft } from "lucide-react";

export const Header = ({ showBack = false, title, Icon, bgClass = "bg-blue-600", onBack }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Route-based back: go up exactly one level (never re-open a viewed PDF).
  const goBack = () => {
    const parts = (location.pathname || "").split("/").filter(Boolean);
    // /exam/:id[/:subject/chapters] -> back to exam dashboard, or home
    if (parts[0] === "exam") {
      if (parts.length >= 5) { navigate("/" + parts.slice(0, parts.length - 1).join("/")); return; }
      if (parts.length >= 3) { navigate(`/exam/${parts[1]}`); return; }
      navigate("/"); return;
    }
    // /subject/:id  -> subject board
    if (parts[0] === "subject" && parts.length === 2) { navigate("/board"); return; }
    // /subject/:id/section[/:x] -> drop the last segment (one level up)
    if (parts.length >= 3) { navigate("/" + parts.slice(0, parts.length - 1).join("/")); return; }
    // /board -> home
    if (parts[0] === "board") { navigate("/"); return; }
    navigate("/");
  };

  if (showBack) {
    // Solid subject-colored header (matches the subject card icon color)
    return (
      <header className={`no-print sticky top-0 z-40 ${bgClass}`}>
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 md:px-8">
          <button
            data-testid="header-back-btn"
            onClick={() => (onBack ? onBack(goBack) : goBack())}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          {Icon && (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 backdrop-blur">
              <Icon className="h-5 w-5 text-white" />
            </div>
          )}
          {title && (
            <h1 className="text-lg font-extrabold tracking-tight text-white md:text-xl">{title}</h1>
          )}
        </div>
      </header>
    );
  }

  return (
    <header className="no-print sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8">
        <button onClick={() => navigate("/")} className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-600/20">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div className="text-left">
            <p className="text-[15px] font-bold leading-tight tracking-tight text-slate-900">
              Exams Made Easy
            </p>
            <p className="text-xs font-medium text-slate-500">Exam Pattern & Analytics</p>
          </div>
        </button>
      </div>
    </header>
  );
};
