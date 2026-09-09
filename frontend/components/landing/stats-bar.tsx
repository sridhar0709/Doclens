"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface Stat {
  target: number;
  suffix: string;
  prefix?: string;
  label: string;
}

const stats: Stat[] = [
  { target: 4700, suffix: "+", label: "Schemes mapped" },
  { target: 28, suffix: "+", label: "States & UTs covered" },
  { target: 100, suffix: "%", label: "Deterministic scoring" },
  { target: 283000, suffix: "Cr+", prefix: "₹", label: "Unclaimed benefits" },
];

export function StatsBar() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const countersRef = useRef<(HTMLParagraphElement | null)[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    // Check for reduced motion
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      countersRef.current.forEach((el, i) => {
        if (el) {
          const s = stats[i];
          el.textContent = `${s.prefix ?? ""}${s.target.toLocaleString("en-IN")}${s.suffix}`;
        }
      });
      return;
    }

    const ctx = gsap.context(() => {
      countersRef.current.forEach((el, i) => {
        if (!el) return;
        const s = stats[i];
        const obj = { val: 0 };

        gsap.fromTo(
          obj,
          { val: 0 },
          {
            val: s.target,
            duration: 1.8,
            ease: "power2.out",
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              toggleActions: "play none none reset",
            },
            onUpdate: () => {
              const formatted = Math.floor(obj.val).toLocaleString("en-IN");
              el.textContent = `${s.prefix ?? ""}${formatted}${s.suffix}`;
            },
            onComplete: () => {
              el.textContent = `${s.prefix ?? ""}${s.target.toLocaleString("en-IN")}${s.suffix}`;
            },
          }
        );
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div ref={sectionRef} className="rounded-2xl border border-ink-navy/10 bg-white px-6 py-8 shadow-sm sm:px-10">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {stats.map((stat, i) => (
            <div key={stat.label} className="text-center">
              <p
                ref={(el) => { countersRef.current[i] = el; }}
                className="font-display text-3xl font-semibold tracking-tight text-ink-navy sm:text-4xl"
              >
                {stat.prefix}{stat.target.toLocaleString("en-IN")}{stat.suffix}
              </p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-blue-400">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
