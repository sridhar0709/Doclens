"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function Features() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const cards = cardsRef.current?.children;
      if (!cards || cards.length === 0) return;

      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      if (mq.matches) return;

      gsap.killTweensOf(cards);

      const ctx = gsap.context(() => {
        gsap.set(cards, { opacity: 0, y: 30 });

        gsap.to(cards, {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.12,
          ease: "power2.out",
          clearProps: "all",
          scrollTrigger: {
            trigger: cardsRef.current,
            start: "top 82%",
            toggleActions: "play none none none",
          },
        });
      }, sectionRef);

      return () => ctx.revert();
    } catch { return; }
  }, []);

  const features = [
    {
      icon: (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      title: "One profile, all schemes",
      description: "Fill in your details once. We match you against every central and state scheme simultaneously — no repeated paperwork.",
    },
    {
      icon: (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      title: "Deterministic & auditable",
      description: "No AI black boxes. Every eligibility decision traces back to published scheme rules. You get a clear reason for every match — and every exclusion.",
    },
    {
      icon: (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
      title: "Know what you're missing",
      description: "See exactly which documents you need for each scheme. Upload once, and we'll pre-fill your applications.",
    },
    {
      icon: (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      title: "Drafted applications",
      description: "For every scheme you qualify for, we generate a pre-filled application letter you can download, sign, and submit.",
    },
    {
      icon: (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "Track your applications",
      description: "From matched to applied to approved — know where each application stands, with reminders for deadlines and missing documents.",
    },
    {
      icon: (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
        </svg>
      ),
      title: "Ask about any scheme",
      description: "Not sure what a scheme covers? Our Q&A assistant explains eligibility, benefits, and application steps in plain language.",
    },
  ];

  return (
    <section ref={sectionRef} className="relative overflow-hidden border-t border-ink-navy/8 py-20 sm:py-28">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "url('/assets/bottom-waves.svg')",
          backgroundSize: "cover",
          backgroundPosition: "center bottom",
          backgroundRepeat: "no-repeat",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/20 to-white/70" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink-navy sm:text-4xl">
            Built for discovery, not bureaucracy
          </h2>
          <p className="mt-3 text-base leading-relaxed text-slate-blue">
            Every feature exists to remove the gap between &ldquo;I might qualify&rdquo; and &ldquo;I have applied.&rdquo;
          </p>
        </div>

        <div
          ref={cardsRef}
          className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-xl border border-ink-navy/8 bg-warm-paper/50 p-6 transition-all hover:border-ink-navy/15 hover:shadow-sm"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-signal-orange/10 text-signal-orange">
                {f.icon}
              </div>
              <h3 className="font-display text-lg font-semibold text-ink-navy">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-blue">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
