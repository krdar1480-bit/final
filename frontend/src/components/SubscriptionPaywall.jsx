import React, { useState } from "react";
import { Lock, Check, X, Crown } from "lucide-react";

const PLANS = [
  { id: "1m", label: "1 Month", months: 1, price: 30, tag: null },
  { id: "2m", label: "2 Months", months: 2, price: 50, tag: "Popular" },
  { id: "5m", label: "5 Months", months: 5, price: 100, tag: "Best Value" },
];

export const SubscriptionPaywall = ({ subjectName = "this subject", onClose = () => {} }) => {
  const [selected, setSelected] = useState("2m");

  return (
    <div
      data-testid="subscription-paywall"
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-sm sm:items-center"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <button
          data-testid="paywall-close-btn"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-br from-rose-600 to-red-600 px-6 pb-8 pt-7 text-center text-white">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
            <Crown className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">Take Subscription</h2>
          <p className="mt-1 text-sm text-rose-100">
            One plan unlocks <span className="font-bold text-white">all Karnataka Board subjects</span>
          </p>
        </div>

        {/* Plans */}
        <div className="space-y-3 px-6 py-6">
          {PLANS.map((p) => {
            const active = selected === p.id;
            return (
              <button
                key={p.id}
                data-testid={`plan-${p.id}`}
                onClick={() => setSelected(p.id)}
                className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-left transition-all ${
                  active ? "border-rose-500 bg-rose-50" : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                    active ? "border-rose-500 bg-rose-500 text-white" : "border-slate-300"
                  }`}
                >
                  {active && <Check className="h-3 w-3" />}
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-900">{p.label}</p>
                  <p className="text-[11px] font-medium text-slate-500">All subjects · full access</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  {p.tag && (
                    <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase text-rose-700">
                      {p.tag}
                    </span>
                  )}
                  <span className="text-lg font-extrabold text-slate-900">₹{p.price}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom lock + CTA */}
        <div className="border-t border-slate-100 px-6 pb-7 pt-5">
          <div className="mb-3 flex items-center justify-center gap-2 text-xs font-semibold text-rose-600">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100">
              <Lock className="h-3.5 w-3.5" />
            </span>
            {subjectName} is locked — subscribe to unlock
          </div>
          <button
            data-testid="paywall-subscribe-btn"
            className="w-full rounded-2xl bg-rose-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-rose-600/30 transition-all hover:-translate-y-0.5 hover:bg-rose-700"
          >
            Take Subscription · ₹{PLANS.find((p) => p.id === selected)?.price}
          </button>
        </div>
      </div>
    </div>
  );
};
