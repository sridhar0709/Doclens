"use client";

import { useState } from "react";
import { ConfidenceBadge } from "@/components/ui/confidence-badge";
import { cn } from "@/lib/utils";

type Step = "form" | "results";

interface SchemeResult {
  id: string;
  name: string;
  confidence: number;
  description: string;
}

const demoResults: SchemeResult[] = [
  { id: "pm-kisan", name: "PM-KISAN", confidence: 0.92, description: "Income support for small farmers" },
  { id: "kalia", name: "KALIA (Odisha)", confidence: 0.76, description: "Farmer welfare — Odisha only" },
  { id: "ayushman", name: "Ayushman Bharat", confidence: 0.45, description: "Health coverage for low-income families" },
];

export function DemoWidget() {
  const [step, setStep] = useState<Step>("form");
  const [age, setAge] = useState("30");
  const [income, setIncome] = useState("3,00,000");
  const [state, setState] = useState("Odisha");
  const [animating, setAnimating] = useState(false);

  function handleCheck() {
    setAnimating(true);
    setTimeout(() => {
      setStep("results");
      setAnimating(false);
    }, 1200);
  }

  function handleReset() {
    setStep("form");
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-ink-navy/10 bg-white shadow-lg shadow-ink-navy/5">
      {/* Top accent bar */}
      <div className="h-1 bg-gradient-to-r from-signal-orange via-petal-gold to-verified-teal" />

      <div className="p-5 sm:p-6">
        {/* Header */}
        <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-blue-400">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Live demo — see how it works
        </div>

        {step === "form" && (
          <div className={cn("space-y-4 transition-opacity", animating && "opacity-50")}>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-blue">Your age</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full rounded-lg border-2 border-ink-navy/10 bg-warm-paper/50 px-3 py-2 text-sm text-ink-navy focus:border-signal-orange focus:outline-none"
                  aria-label="Your age"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-blue">Annual income (₹)</label>
                <input
                  type="text"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  className="w-full rounded-lg border-2 border-ink-navy/10 bg-warm-paper/50 px-3 py-2 text-sm text-ink-navy focus:border-signal-orange focus:outline-none"
                  aria-label="Annual income"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-blue">Your state</label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full rounded-lg border-2 border-ink-navy/10 bg-warm-paper/50 px-3 py-2 text-sm text-ink-navy focus:border-signal-orange focus:outline-none"
                  aria-label="Your state"
                >
                  <option>Odisha</option>
                  <option>Madhya Pradesh</option>
                  <option>Uttar Pradesh</option>
                  <option>Bihar</option>
                  <option>Maharashtra</option>
                  <option>Rajasthan</option>
                  <option>Tamil Nadu</option>
                  <option>Karnataka</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleCheck}
              disabled={animating}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-signal-orange px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-signal-orange-600 active:bg-signal-orange-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {animating ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Checking eligibility...
                </>
              ) : (
                <>
                  Check eligibility
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        )}

        {step === "results" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-ink-navy">
                You may qualify for <span className="text-signal-orange">3 schemes</span>
              </p>
              <button
                onClick={handleReset}
                className="text-xs font-medium text-slate-blue-400 underline underline-offset-2 hover:text-ink-navy transition-colors"
              >
                Try again
              </button>
            </div>

            <div className="space-y-2">
              {demoResults.map((scheme) => (
                <div
                  key={scheme.id}
                  className="flex items-center gap-3 rounded-lg border border-ink-navy/8 bg-warm-paper/50 p-3 transition-colors hover:border-ink-navy/15"
                >
                  <ConfidenceBadge score={scheme.confidence} size="sm" showLabel={false} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-navy">{scheme.name}</p>
                    <p className="truncate text-xs text-slate-blue-400">{scheme.description}</p>
                  </div>
                  <svg className="h-4 w-4 flex-shrink-0 text-slate-blue-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-blue-400">
              This is a demonstration. Your actual eligibility will be calculated based on your full profile.
            </p>
          </div>
        )}
      </div>

      {/* Terminal-style request ID */}
      <div className="border-t border-ink-navy/8 bg-ink-navy/5 px-5 py-2 sm:px-6">
        <span className="font-mono text-[11px] text-slate-blue-400">
          {step === "results" ? "✓ deterministic match • req_8f3a2c" : "⏎ enter your details above →"}
        </span>
      </div>
    </div>
  );
}
