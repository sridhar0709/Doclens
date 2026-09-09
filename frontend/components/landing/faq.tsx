"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import gsap from "gsap";
import { cn } from "@/lib/utils";

const icons = {
  home: (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <path d="M3 12l13-9 13 9" />
      <path d="M7 10v11a2 2 0 002 2h14a2 2 0 002-2V10" />
      <path d="M13 21v-4h6v4" />
    </svg>
  ),
  family: (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <circle cx="10" cy="8" r="3" />
      <circle cx="22" cy="8" r="3" />
      <circle cx="16" cy="14" r="3" />
      <path d="M4 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
      <path d="M20 19v-2a4 4 0 014-4h0a4 4 0 014 4v2" />
      <path d="M6 24h20" opacity="0.4" />
    </svg>
  ),
  hands: (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <path d="M8 20c0-2 0-4 2-6l2-2c1-1 2-4 2-7 0-2 2-3 3-2s2 2 1 5l-1 3 2-2c2-2 4-3 5-1 1 2 0 5-2 7l-3 3" />
      <path d="M8 20c-2 0-4 2-4 5v3" />
      <path d="M22 19c2 0 4 2 4 5v4" />
      <path d="M14 14l-2 4" opacity="0.5" />
      <path d="M18 14l-2 4" opacity="0.5" />
    </svg>
  ),
  health: (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <path d="M16 2C8 2 2 8 2 16s6 14 14 14 14-6 14-14S24 2 16 2z" />
      <path d="M16 10v12M10 16h12" />
    </svg>
  ),
  education: (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <path d="M2 20V8l14-5 14 5v12" />
      <path d="M2 12v8c0 4 7 6 14 6s14-2 14-6v-8" />
      <path d="M16 20c-5 0-12-1-14-3v4c2 2 9 3 14 3s12-1 14-3v-4c-2 2-9 3-14 3z" />
    </svg>
  ),
  rupee: (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <circle cx="16" cy="16" r="13" />
      <path d="M10 10h12" />
      <path d="M10 15h8" />
      <path d="M18 10l-5 12" />
      <path d="M10 20h4" />
    </svg>
  ),
  farmer: (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <path d="M16 4v8" />
      <path d="M12 8h8" />
      <circle cx="16" cy="15" r="4" />
      <path d="M8 24v-3c0-3 3-5 8-5s8 2 8 5v3" />
      <path d="M4 26c0-2 2-4 4-4" opacity="0.4" />
      <path d="M28 26c0-2-2-4-4-4" opacity="0.4" />
    </svg>
  ),
  elderly: (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <path d="M16 10c-3 0-5 2-5 5v2" />
      <path d="M21 10c3 0 5 2 5 5v2" />
      <path d="M11 17h10v3c0 3-2 5-5 5s-5-2-5-5v-3z" />
      <path d="M8 22c-3 0-5 2-5 5v2" />
      <path d="M24 22c3 0 5 2 5 5v2" />
      <path d="M3 29h26" opacity="0.3" />
    </svg>
  ),
  womanchild: (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <circle cx="12" cy="10" r="4" />
      <path d="M6 24v-3c0-3 3-5 6-5s6 2 6 5v3" />
      <circle cx="24" cy="18" r="3" />
      <path d="M20 27c0-2 2-3 4-3s4 1 4 3" />
      <path d="M15 14l10 3" opacity="0.4" />
    </svg>
  ),
  cert: (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <path d="M8 4h12l6 6v18H8z" />
      <path d="M20 4v6h6" />
      <path d="M12 16h8M12 21h5" />
      <circle cx="16" cy="26" r="2" />
    </svg>
  ),
};

const faqs = [
  {
    icon: "cert",
    q: "Is DocLens a government website?",
    a: "No. DocLens is an independent, open-source project built by community contributors. We are not affiliated with the Government of India, any state government, or any government agency. We clearly mark this distinction throughout the site — always verify eligibility with the relevant government authority before applying.",
  },
  {
    icon: "education",
    q: "How is my eligibility calculated?",
    a: "By a deterministic rule engine — not an AI or LLM. Every eligibility decision is made by comparing your profile against published scheme rules (age limits, income thresholds, residency requirements, etc.). You get a clear, auditable reason for every match and every exclusion.",
  },
  {
    icon: "home",
    q: "Is my data safe?",
    a: "Your profile data is encrypted in transit and at rest. We never share your personal information with third parties. You can delete your account and all associated data at any time. See our Privacy Policy for details.",
  },
  {
    icon: "family",
    q: "Which schemes are covered?",
    a: "We currently map over 20 central and state schemes across agriculture, housing, health, education, pension, and women & child welfare categories. The scheme library is community-maintained and growing — contributions are welcome on GitHub.",
  },
  {
    icon: "hands",
    q: "Does this guarantee I'll get benefits?",
    a: "No. Our eligibility check tells you which schemes you likely qualify for based on published rules. Final approval rests with the respective government authority. We provide pre-filled application drafts to make the process easier, but we cannot guarantee outcomes.",
  },
  {
    icon: "farmer",
    q: "How is this different from a LLM chatbot?",
    a: "We never use a language model to decide your eligibility. The rule engine is deterministic — same profile always produces the same results. We do use an LLM for one narrow task: polishing the language of benefit summaries and application drafts, with a hardcoded fallback if the LLM is unavailable.",
  },
];

function AccordionItem({
  faq,
  isOpen,
  onClick,
  icon,
}: {
  faq: (typeof faqs)[0];
  isOpen: boolean;
  onClick: () => void;
  icon: ReactNode;
}) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    gsap.killTweensOf(el);
    gsap.to(el, {
      height: isOpen ? "auto" : 0,
      opacity: isOpen ? 1 : 0,
      duration: 0.25,
      ease: "power2.out",
      overwrite: "auto",
    });
  }, [isOpen]);

  return (
    <div
      className={cn(
        "rounded-xl border transition-colors",
        isOpen
          ? "border-ink-navy/15 bg-white shadow-sm"
          : "border-ink-navy/8 bg-white/60 hover:bg-white hover:border-ink-navy/12"
      )}
    >
      <button
        onClick={onClick}
        className="flex w-full items-center gap-3 px-5 py-4 text-left"
        aria-expanded={isOpen}
      >
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-signal-orange/10 text-signal-orange">
          {icon}
        </span>
        <span className="flex-1 text-sm font-semibold text-ink-navy sm:text-base">
          {faq.q}
        </span>
        <svg
          className={cn(
            "h-5 w-5 flex-shrink-0 text-slate-blue-400 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <div
        ref={contentRef}
        className="overflow-hidden"
        style={{ height: 0, opacity: 0 }}
      >
        <div className="border-t border-ink-navy/8 px-5 pb-4 pt-3">
          <p className="text-sm leading-relaxed text-slate-blue">{faq.a}</p>
        </div>
      </div>
    </div>
  );
}

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  const womanRef = useRef<HTMLImageElement>(null);
  const labourRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;

    const woman = womanRef.current;
    const labour = labourRef.current;
    if (!woman || !labour) return;

    const ctx = gsap.context(() => {
      gsap.to(woman, {
        y: -12,
        duration: 5,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
      gsap.to(labour, {
        y: -10,
        duration: 6,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: 1.5,
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <section className="relative overflow-hidden border-t border-ink-navy/8 bg-warm-paper py-20 sm:py-28">
      {/* Woman image — fixed position, not affected by accordion height changes */}
      <img
        ref={womanRef}
        src="/assets/woman.png"
        alt=""
        aria-hidden
        className="pointer-events-none absolute bottom-0 opacity-[0.12]"
        style={{ right: "-5%", height: "110%", maxHeight: "780px" }}
      />
      {/* Labour image — left side */}
      <img
        ref={labourRef}
        src="/assets/labour.png"
        alt=""
        aria-hidden
        className="pointer-events-none absolute bottom-0 opacity-[0.12]"
        style={{ left: "-5%", height: "110%", maxHeight: "780px" }}
      />
      {/* Decorative animated SVGs on left side */}
      <div className="pointer-events-none absolute inset-0">
        <span className="absolute left-[6%] top-[8%] scale-[2.5] animate-breathe text-signal-orange/15">{icons.home}</span>
        <span className="absolute left-[4%] top-[40%] scale-[2] animate-[float_6s_ease-in-out_infinite] text-ink-navy/10">{icons.hands}</span>
        <span className="absolute left-[8%] bottom-[18%] scale-[2.5] animate-pulse text-signal-orange/10" style={{ animationDuration: "3s" }}>{icons.education}</span>
        <span className="absolute left-[40%] top-[3%] scale-[2] animate-[float_8s_ease-in-out_infinite_1s] text-signal-orange/10">{icons.womanchild}</span>
        <span className="absolute left-[2%] top-[68%] scale-[1.8] animate-breathe text-ink-navy/8">{icons.farmer}</span>
      </div>
      <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink-navy sm:text-4xl">
            Common questions
          </h2>
          <p className="mt-3 text-base leading-relaxed text-slate-blue">
            Quick answers to the things most people ask.
          </p>
        </div>

        <div className="mt-12 space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              faq={faq}
              icon={icons[faq.icon as keyof typeof icons]}
              isOpen={open === i}
              onClick={() => setOpen(open === i ? null : i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
