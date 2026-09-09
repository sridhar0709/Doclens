"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import Link from "next/link";

const faqs = [
  {
    q: "How do I check which schemes I qualify for?",
    a: "Create an account and fill in your profile — age, income, state, occupation. Our rule engine checks every mapped scheme against your details and returns a ranked list with confidence scores.",
  },
  {
    q: "Is DocLens a government website?",
    a: "No. DocLens is an independent, open-source project built by community contributors. We are not affiliated with any government entity. Always verify eligibility with the relevant authority before applying.",
  },
  {
    q: "How accurate is the eligibility check?",
    a: "The rule engine is deterministic — same profile always returns the same results. Accuracy depends on the scheme rules we have mapped. We source rules from publicly available government publications and update them as schemes change.",
  },
  {
    q: "My eligibility seems wrong. What should I do?",
    a: "First, check if your profile information is correct. If it is, the scheme rules may have changed or we may have incomplete data. Please open an issue on GitHub so we can investigate and update the rules.",
  },
  {
    q: "Can I apply for schemes directly through DocLens?",
    a: "We provide pre-filled application drafts you can download and submit. Some schemes have online portals we link to, but we do not submit applications on your behalf — final submission must go through the official channel.",
  },
  {
    q: "How do I delete my account and data?",
    a: "Go to Settings > Delete account. This removes your profile, uploaded documents, and all associated data. Account deletion is irreversible.",
  },
];

function FAQItem({ q, a, idx }: { q: string; a: string; idx: number }) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    try {
      gsap.killTweensOf(el);
      gsap.fromTo(el, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.3, delay: idx * 0.05, ease: "power2.out", clearProps: "all" });
    } catch { /* skip */ }
  }, [idx]);

  return (
    <details ref={detailsRef} className="group rounded-xl border border-ink-navy/10 bg-white transition-all open:border-ink-navy/15 open:shadow-md hover:shadow-sm">
      <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm font-semibold text-ink-navy sm:text-base">
        {q}
        <svg className="h-5 w-5 flex-shrink-0 text-slate-blue-400 transition-transform group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </summary>
      <div ref={contentRef} className="border-t border-ink-navy/8 px-5 pb-4 pt-3">
        <p className="text-sm leading-relaxed text-slate-blue">{a}</p>
      </div>
    </details>
  );
}

export default function SupportPage() {
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const spEls = pageRef.current?.querySelectorAll(".sp-hero, .sp-card");
      if (spEls?.length) gsap.killTweensOf(spEls);
      const ctx = gsap.context(() => {
        gsap.fromTo(".sp-hero", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out", clearProps: "all" });
        gsap.fromTo(".sp-card", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.1, delay: 0.2, ease: "power2.out", clearProps: "all" });
      }, pageRef);
      return () => ctx.revert();
    } catch { return; }
  }, []);

  return (
    <div ref={pageRef} className="flex min-h-screen flex-col">
      <main className="flex-1 bg-gradient-to-b from-white to-warm-paper">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="sp-hero text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-signal-orange/20 to-signal-orange/5 ring-1 ring-signal-orange/20">
              <svg className="h-7 w-7 text-signal-orange" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
                <path d="M12 17h.01" />
              </svg>
            </div>
            <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-ink-navy sm:text-4xl">Support</h1>
            <p className="mt-2 text-base text-slate-blue max-w-md mx-auto">Get help using DocLens, report issues, or ask our community.</p>
          </div>

          <div className="mt-12">
            <h2 className="font-display text-xl font-semibold text-ink-navy">Frequently asked questions</h2>
            <div className="mt-4 space-y-3">
              {faqs.map((faq, i) => (
                <FAQItem key={i} q={faq.q} a={faq.a} idx={i} />
              ))}
            </div>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <div className="sp-card rounded-xl border border-ink-navy/10 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink-navy/5 text-ink-navy">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
              </div>
              <h3 className="mt-3 font-display text-lg font-semibold text-ink-navy">Report a bug</h3>
              <p className="mt-1 text-sm text-slate-blue">Something not working right? Open a GitHub issue with details about what happened.</p>
              <a href="https://github.com/sridhar0709/Document-analysis/issues" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center text-sm font-semibold text-signal-orange hover:text-signal-orange-600 transition-colors">
                Report on GitHub →
              </a>
            </div>
            <div className="sp-card rounded-xl border border-ink-navy/10 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink-navy/5 text-ink-navy">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              </div>
              <h3 className="mt-3 font-display text-lg font-semibold text-ink-navy">Ask a question</h3>
              <p className="mt-1 text-sm text-slate-blue">Have a question about how something works? Our community discusses on GitHub.</p>
              <a href="https://github.com/sridhar0709/Document-analysis/discussions" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center text-sm font-semibold text-signal-orange hover:text-signal-orange-600 transition-colors">
                Ask in Discussions →
              </a>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <div className="rounded-xl border border-caution-amber/20 bg-gradient-to-br from-caution-amber/[0.04] to-transparent px-5 py-4">
              <p className="text-xs leading-relaxed text-slate-blue">
                <strong className="text-caution-amber">Volunteer-run project:</strong> DocLens is maintained by contributors in their spare time.
                We respond to GitHub issues and discussions as we are able, but do not guarantee response times.
                If you need urgent help with a specific scheme application, please contact the relevant government department directly.
              </p>
            </div>

            <div className="rounded-xl border border-ink-navy/10 bg-white px-5 py-4">
              <p className="text-xs leading-relaxed text-slate-blue">
                <strong>Open-source project.</strong> DocLens is built in the open under the MIT license.
                You can star the repository on{" "}
                <a href="https://github.com/sridhar0709/Document-analysis" target="_blank" rel="noopener noreferrer" className="font-medium text-signal-orange underline underline-offset-2">GitHub</a>
                {" "}to show your support.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
