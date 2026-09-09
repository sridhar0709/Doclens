"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

const schemeScores: Record<string, number> = {
  "PM-KISAN": 92,
  KALIA: 76,
  "Ayushman Bharat": 45,
};

function SchemeCard({
  name,
  desc,
  color,
  delay,
}: {
  name: string;
  desc: string;
  color: "orange" | "teal" | "amber";
  delay: number;
}) {
  const score = schemeScores[name] ?? 70;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    gsap.killTweensOf(el);
    const tween = gsap.fromTo(
      el,
      { opacity: 0, x: 20 },
      { opacity: 1, x: 0, duration: 0.5, delay, ease: "power2.out", clearProps: "all" }
    );
    return () => { tween.kill(); };
  }, [delay]);

  const colors = {
    orange: { ring: "stroke-signal-orange", text: "text-signal-orange", bg: "bg-signal-orange/10" },
    teal: { ring: "stroke-verified-teal", text: "text-verified-teal", bg: "bg-verified-teal/10" },
    amber: { ring: "stroke-caution-amber", text: "text-caution-amber", bg: "bg-caution-amber/10" },
  };

  const c = colors[color];

  return (
    <div
      ref={ref}
      className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur-sm"
    >
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${c.bg}`}>
        <svg className={`h-5 w-5 ${c.text}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
          <path d="M9 12l2 2 4-4" />
          <circle cx="12" cy="12" r="10" />
        </svg>
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-white">{name}</p>
        <p className="text-xs text-white/50">{desc}</p>
      </div>
      <div className="flex items-center gap-1.5">
        <span className={`text-sm font-bold font-mono ${c.text}`}>{score}%</span>
        <svg className={`h-8 w-8 -rotate-90 ${c.ring}`} viewBox="0 0 32 32" aria-hidden="true">
          <circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.2" />
          <circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="82" strokeDashoffset="20" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

export function HeroPanel() {
  const panelRef = useRef<HTMLDivElement>(null);
  const emblemRef = useRef<SVGSVGElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      if (mq.matches) return;

      const hpEls = panelRef.current?.querySelectorAll(".hp-emblem, .hp-title, .hp-badge, .hp-pulse-ring, .hp-stat-num");
      if (hpEls?.length) gsap.killTweensOf(hpEls);

      const ctx = gsap.context(() => {
        gsap.fromTo(".hp-emblem", { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.7)", clearProps: "all" });
        gsap.fromTo(".hp-title", { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: 0.4, delay: 0.15, ease: "power2.out", clearProps: "all" });
        gsap.fromTo(".hp-badge", { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.4, delay: 0.3, ease: "back.out(1.7)", clearProps: "all" });

        gsap.to(".hp-pulse-ring", {
          scale: 1.6,
          opacity: 0,
          duration: 2,
          repeat: -1,
          ease: "power2.out",
          stagger: 0.4,
        });

        const statNums = statsRef.current?.querySelectorAll(".hp-stat-num");
        if (statNums) {
          gsap.fromTo(statNums, { textContent: 0 }, {
            textContent: 1,
            duration: 1.2,
            delay: 0.6,
            ease: "power2.out",
            snap: { textContent: 1 },
            stagger: 0.15,
          });
        }
      }, panelRef);

      return () => ctx.revert();
    } catch { return; }
  }, []);

  return (
    <div
      ref={panelRef}
      className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-[#3730A3] via-[#1E1B4B] to-[#312E81] border border-white/10 shadow-2xl shadow-ink-navy/30"
    >
      {/* Subtle grid pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M0 0h1v40H0zM0 0h40v1H0z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}
      />

      {/* Glow accents */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-signal-orange/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-verified-teal/10 blur-3xl" />

      {/* Content */}
      <div className="relative px-6 pb-6 pt-8 sm:px-8 sm:pb-8 sm:pt-10">
        {/* Top: Emblem + Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg ref={emblemRef} className="hp-emblem h-10 w-10 text-signal-orange" viewBox="0 0 100 100" fill="none" aria-hidden="true">
              <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="2" opacity="0.4" />
              <circle cx="50" cy="50" r="38" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 6" opacity="0.3" />
              <path d="M50 8 Q70 30 50 50 Q30 30 50 8Z" fill="currentColor" opacity="0.7" />
              <circle cx="50" cy="50" r="6" fill="currentColor" />
              <path d="M50 56 L38 74 L62 74 Z" fill="currentColor" opacity="0.5" />
            </svg>
            <div>
              <p className="hp-title text-sm font-semibold tracking-wide text-white/80">
                DocLens
              </p>
              <p className="text-[10px] font-medium tracking-[0.15em] text-white/40 uppercase">
                Eligibility Engine
              </p>
            </div>
          </div>

          {/* Verified badge */}
          <div className="hp-badge relative flex items-center gap-1.5 rounded-full border border-verified-teal/30 bg-verified-teal/10 px-3 py-1">
            <div className="relative">
              <div className="h-2 w-2 rounded-full bg-verified-teal" />
              <div className="hp-pulse-ring absolute inset-0 h-2 w-2 rounded-full border border-verified-teal" />
            </div>
            <span className="text-[11px] font-semibold text-verified-teal">Verified</span>
          </div>
        </div>

        {/* Main card: Digital citizen profile */}
        <div className="mb-5 rounded-xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm">
          <div className="mb-4 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/20">
              <img src="/assets/logo-bg.png" alt="DocLens" className="h-full w-full object-contain" loading="lazy" />
            </div>
            <div>
              <p className="text-sm font-medium text-white/90">Your Digital Profile</p>
              <p className="text-xs text-white/40">Age · Income · State · Category</p>
            </div>
            <div className="ml-auto">
              <div className="rounded-lg border border-white/10 bg-white/[0.06] px-3 py-1.5 text-center">
                <p className="text-xs font-semibold text-white">Matched</p>
                <p className="hp-stat-num font-display text-xl font-bold text-signal-orange">0</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {["Farmer", "Odisha", "Age 29", "BPL", "OBC"].map((tag) => (
              <span key={tag} className="rounded-md bg-white/[0.06] px-2.5 py-1 text-[11px] font-medium text-white/60 ring-1 ring-white/10">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Scheme cards */}
        <div className="mb-5 space-y-2.5">
          <SchemeCard name="PM-KISAN" desc="Income support · ₹6,000/yr" color="teal" delay={0.4} />
          <SchemeCard name="KALIA" desc="Farmer welfare · Odisha" color="teal" delay={0.55} />
          <SchemeCard name="Ayushman Bharat" desc="Health coverage · ₹5L" color="amber" delay={0.7} />
        </div>

        {/* Bottom stats */}
        <div
          ref={statsRef}
          className="grid grid-cols-3 gap-3"
        >
          {[
            { label: "Schemes Found", value: 14, suffix: "+" },
            { label: "Ready to Apply", value: 8, suffix: "" },
            { label: "Avg. Match", value: 78, suffix: "%" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-center backdrop-blur-sm">
              <p className="hp-stat-num font-display text-xl font-bold text-white">{stat.value}</p>
              <p className="text-[10px] font-medium text-white/40">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Bottom trust line */}
        <div className="mt-4 flex items-center justify-center gap-3 text-[10px] text-white/30">
          <span className="flex items-center gap-1">
            <svg className="h-3 w-3 text-verified-teal/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Deterministic
          </span>
          <span className="flex items-center gap-1">
            <svg className="h-3 w-3 text-verified-teal/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Encrypted
          </span>
          <span className="flex items-center gap-1">
            <svg className="h-3 w-3 text-verified-teal/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            Open Source
          </span>
        </div>
      </div>
    </div>
  );
}
