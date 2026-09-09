"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Button } from "@/components/ui/button";

export default function GetInvolvedPage() {
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const giEls = pageRef.current?.querySelectorAll(".gi-hero, .gi-card");
      if (giEls?.length) gsap.killTweensOf(giEls);
      const ctx = gsap.context(() => {
        gsap.fromTo(".gi-hero", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out", clearProps: "all" });
        gsap.fromTo(".gi-card", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.1, delay: 0.2, ease: "power2.out", clearProps: "all" });
      }, pageRef);
      return () => ctx.revert();
    } catch { return; }
  }, []);

  return (
    <div ref={pageRef} className="flex min-h-screen flex-col">
      <main className="flex-1 bg-gradient-to-b from-white to-warm-paper">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="gi-hero text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-signal-orange/20 to-signal-orange/5 ring-1 ring-signal-orange/20">
              <svg className="h-7 w-7 text-signal-orange" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-ink-navy sm:text-4xl">Get involved</h1>
            <p className="mt-2 text-base text-slate-blue">DocLens is community-built. Here&apos;s how you can help.</p>
          </div>

          <div className="mt-12 space-y-6">
            <section className="gi-card rounded-2xl border border-ink-navy/10 bg-white p-6 shadow-sm hover:shadow-md transition-all">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-display text-xl font-semibold text-ink-navy">Star this project on GitHub</h2>
                  <p className="mt-1 text-sm text-slate-blue">A GitHub star is the easiest way to help — it improves our visibility and signals that this project matters.</p>
                </div>
                <a href="https://github.com/sridhar0709/Document-analysis" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-ink-navy px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-ink-navy-700 hover:shadow-md">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                  Star on GitHub
                </a>
              </div>
            </section>

            <section className="gi-card rounded-2xl border border-ink-navy/10 bg-white p-6 shadow-sm hover:shadow-md transition-all">
              <h2 className="font-display text-xl font-semibold text-ink-navy">Found a bug or have a question?</h2>
              <p className="mt-1 text-sm text-slate-blue">The best place to report issues or ask questions is our GitHub Discussions. We don&apos;t run a dedicated support inbox — using GitHub means everyone benefits from the answers.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <a href="https://github.com/sridhar0709/Document-analysis/issues" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-signal-orange underline underline-offset-2 hover:text-signal-orange-600 transition-colors">Report a bug →</a>
                <a href="https://github.com/sridhar0709/Document-analysis/discussions" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-signal-orange underline underline-offset-2 hover:text-signal-orange-600 transition-colors">Ask in Discussions →</a>
              </div>
            </section>

            <section className="gi-card rounded-2xl border border-ink-navy/10 bg-white p-6 shadow-sm hover:shadow-md transition-all">
              <h2 className="font-display text-xl font-semibold text-ink-navy">Want to contribute?</h2>
              <p className="mt-1 text-sm text-slate-blue">We welcome contributions from developers, scheme experts, translators, and designers. The project is fully open-source and documented.</p>
              <ul className="mt-4 space-y-2">
                {[
                  "Add or update scheme rules — help us cover more schemes across more states",
                  "Improve the rule engine — make eligibility scoring more accurate",
                  "Translate the interface — help us reach citizens in their preferred language",
                  "Fix bugs or improve accessibility — every contribution matters",
                  "Document schemes — write clear, citizen-friendly scheme descriptions",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-slate-blue">
                    <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-verified-teal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M5 13l4 4L19 7" /></svg>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap gap-3">
                <a href="https://github.com/sridhar0709/Document-analysis/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-signal-orange underline underline-offset-2 hover:text-signal-orange-600 transition-colors">Read CONTRIBUTING.md →</a>
                <a href="https://github.com/sridhar0709/Document-analysis/issues?q=label%3A%22good+first+issue%22" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-signal-orange underline underline-offset-2 hover:text-signal-orange-600 transition-colors">Good first issues →</a>
              </div>
            </section>

            <section className="gi-card rounded-2xl border border-ink-navy/10 bg-white p-6 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-ink-navy/5">
                  <svg className="h-5 w-5 text-ink-navy" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                </div>
                <div>
                  <h2 className="font-display text-xl font-semibold text-ink-navy">Open source</h2>
                  <p className="mt-1 text-sm text-slate-blue">The entire DocLens codebase is open-source under the MIT license. You can inspect it, run it yourself, or contribute. No proprietary dependencies, no black boxes.</p>
                  <a href="https://github.com/sridhar0709/Document-analysis" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center text-sm font-semibold text-signal-orange underline underline-offset-2 hover:text-signal-orange-600 transition-colors">View on GitHub →</a>
                </div>
              </div>
            </section>
          </div>

          <div className="mt-8 rounded-xl border border-caution-amber/20 bg-gradient-to-br from-caution-amber/[0.04] to-transparent px-5 py-4">
            <p className="text-xs leading-relaxed text-slate-blue">
              <strong className="text-caution-amber">Not a support desk:</strong> DocLens is maintained by volunteers in their spare time.
              We respond to GitHub issues and discussions as we are able, but we cannot guarantee response times.
              If you need help applying for a specific scheme, please contact the relevant government department directly.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
