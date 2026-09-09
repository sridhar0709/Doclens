"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// ─── Animated counter ─────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1.6, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf: number;
    const startTime = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - startTime) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(eased * target));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, start]);
  return value;
}

function AnimatedStat({
  value, suffix, label,
}: { value: number; suffix: string; label: string }) {
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const count = useCountUp(value, 1.4, started);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setStarted(true); obs.disconnect(); } }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className="text-center">
      <p className="font-display text-4xl font-bold tabular-nums text-ink-navy">
        {count.toLocaleString()}<span className="text-signal-orange">{suffix}</span>
      </p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-slate-blue/70">{label}</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AboutPage() {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    (async () => {
      try {
        const gsap = (await import("gsap")).default;
        const ctx = gsap.context(() => {
          gsap.fromTo(".ab-in", { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: "power2.out", clearProps: "all" });
        }, heroRef);
        cleanup = () => ctx.revert();
      } catch { return; }
    })();
    return () => { cleanup?.(); };
  }, []);

  return (
    <div className="min-h-screen bg-warm-paper">

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <div ref={heroRef} className="relative overflow-hidden bg-[#3730A3]">
        {/* Fine grid overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "40px 40px" }}
        />
        {/* Subtle glow */}
        <div className="pointer-events-none absolute left-1/2 top-0 h-[1px] w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="pointer-events-none absolute -right-32 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-signal-orange/[0.06] blur-3xl" />

        <div className="relative mx-auto max-w-5xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="max-w-2xl">
            {/* Eyebrow */}
            <div className="ab-in mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-verified-teal animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Open Source · MIT License</span>
            </div>

            <h1 className="ab-in font-display text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              India&apos;s welfare<br />
              <span className="text-signal-orange">discovery platform</span>
            </h1>

            <p className="ab-in mt-6 text-base leading-relaxed text-slate-400 sm:text-lg max-w-xl">
              We match citizens to government schemes they qualify for — completely free, fully auditable,
              and open source. No government affiliation, no fees, no black boxes.
            </p>

            <div className="ab-in mt-8 flex flex-wrap gap-3">
              <a
                href="https://github.com/sridhar0709/Document-analysis"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-white/10 border border-white/15 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/[0.17]"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
                View on GitHub
              </a>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-lg bg-signal-orange px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-signal-orange/25 transition-all hover:bg-signal-orange-600"
              >
                Check my eligibility
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats band ───────────────────────────────────────────────────────── */}
      <div className="border-b border-ink-navy/8 bg-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 divide-x divide-ink-navy/8 sm:grid-cols-4">
            {[
              { value: 4700, suffix: "+", label: "Schemes mapped" },
              { value: 10,   suffix: "+", label: "States covered"  },
              { value: 100,  suffix: "%", label: "Open source"     },
              { value: 0,    suffix: " ₹",label: "Cost to citizens"},
            ].map((s) => (
              <div key={s.label} className="py-8 px-4">
                <AnimatedStat {...s} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8 space-y-20">

        {/* ── What is it ─────────────────────────────────────────────────────── */}
        <section className="grid gap-10 lg:grid-cols-[1fr_2fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-signal-orange mb-3">The problem</p>
            <h2 className="font-display text-2xl font-bold text-ink-navy leading-snug">
              Welfare discovery is broken
            </h2>
          </div>
          <div className="space-y-4 text-[15px] leading-relaxed text-slate-blue sm:text-base">
            <p>
              India runs hundreds of welfare schemes across central and state governments — pension support, health coverage,
              housing subsidies, education scholarships, agricultural assistance. Together they represent{" "}
              <strong className="font-semibold text-ink-navy">billions of rupees in unclaimed benefits each year</strong>.
            </p>
            <p>
              The barrier isn't eligibility — it's <strong className="font-semibold text-ink-navy">discovery</strong>.
              Schemes are scattered across different ministry portals, in different formats, with different application windows.
              A farmer in Odisha may qualify for PM-KISAN, KALIA, Ayushman Bharat, and a state housing scheme — but has
              no single place to find all of them at once.
            </p>
            <p>
              DocLens solves that: tell us about yourself once, and we instantly match you against every scheme we've
              mapped — showing you what you qualify for, which documents you need, and how to apply.
            </p>
          </div>
        </section>

        {/* ── Divider ────────────────────────────────────────────────────────── */}
        <hr className="border-ink-navy/8" />

        {/* ── How it works ────────────────────────────────────────────────────── */}
        <section className="grid gap-10 lg:grid-cols-[1fr_2fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-signal-orange mb-3">The approach</p>
            <h2 className="font-display text-2xl font-bold text-ink-navy leading-snug">
              How it works
            </h2>
          </div>
          <ol className="space-y-6">
            {[
              {
                n: "01",
                title: "Fill your profile",
                desc: "Enter basic details — age, income, state, occupation. Takes about 2 minutes.",
              },
              {
                n: "02",
                title: "We match you instantly",
                desc: "Our deterministic rule engine checks every scheme against your profile. No AI black boxes — every result is fully auditable.",
              },
              {
                n: "03",
                title: "Apply with confidence",
                desc: "See what you qualify for, exactly which documents are missing, and get a pre-filled application draft for each scheme.",
              },
            ].map((item) => (
              <li key={item.n} className="flex gap-5">
                <span className="shrink-0 font-display text-3xl font-bold text-ink-navy/10 leading-none mt-0.5">{item.n}</span>
                <div>
                  <h3 className="font-semibold text-ink-navy text-[15px]">{item.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-blue">{item.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* ── Divider ────────────────────────────────────────────────────────── */}
        <hr className="border-ink-navy/8" />

        {/* ── Star the repo ───────────────────────────────────────────────────── */}
        <section className="flex flex-col gap-6 rounded-2xl bg-[#3730A3] p-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-2">Support the project</p>
            <h2 className="font-display text-2xl font-bold text-white">Star us on GitHub</h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-400">
              A GitHub star is the simplest way to help — it improves our visibility, signals that this work matters,
              and keeps us motivated to build.
            </p>
          </div>
          <a
            href="https://github.com/sridhar0709/Document-analysis"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-2.5 rounded-lg border border-yellow-400/30 bg-yellow-400/10 px-6 py-3 text-sm font-bold text-yellow-300 transition-all hover:bg-yellow-400/20 hover:border-yellow-400/50"
          >
            <svg className="h-5 w-5 fill-yellow-400" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            Star on GitHub
          </a>
        </section>

        {/* ── Divider ────────────────────────────────────────────────────────── */}
        <hr className="border-ink-navy/8" />

        {/* ── Who built it ────────────────────────────────────────────────────── */}
        <section className="grid gap-10 lg:grid-cols-[1fr_2fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-signal-orange mb-3">The team</p>
            <h2 className="font-display text-2xl font-bold text-ink-navy leading-snug">
              Who built this?
            </h2>
          </div>
          <div className="space-y-6 text-[15px] leading-relaxed text-slate-blue sm:text-base">
            <p>
              DocLens is built by two independent developers under the{" "}
              <a
                href="https://github.com/sridhar0709/Document-analysis"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-signal-orange underline underline-offset-2"
              >
                DocLens
              </a>{" "}
              organization on GitHub. We are not a company, not a startup, and not affiliated with any government body.
            </p>

            {/* Contributor profiles */}
            <div className="flex flex-col gap-3 sm:flex-row">
              {[
                { name: "Prem Rajesh", handle: "PREMRAJESH",  href: "https://github.com/PREMRAJESH"  },
                { name: "Dvij Joshi",  handle: "Dvij-Joshi",  href: "https://github.com/Dvij-Joshi"  },
              ].map((person) => (
                <a
                  key={person.handle}
                  href={person.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-3 rounded-lg border border-ink-navy/10 bg-warm-paper px-4 py-3 text-sm transition-all hover:border-signal-orange/30 hover:bg-white"
                >
                  <svg className="h-4 w-4 shrink-0 text-ink-navy/40 group-hover:text-signal-orange transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-semibold text-ink-navy group-hover:text-signal-orange transition-colors leading-none">{person.name}</p>
                    <p className="text-xs text-slate-blue/60 mt-0.5">@{person.handle}</p>
                  </div>
                  <svg className="ml-auto h-3.5 w-3.5 text-slate-blue/30 group-hover:text-signal-orange transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
                </a>
              ))}
            </div>

            <p>
              We started this because we believe access to welfare information should not depend on which websites you
              know to visit or which officials you can reach. The entire codebase is open-source — inspect it,
              contribute to it, or fork it.
            </p>
          </div>
        </section>

        {/* ── Divider ────────────────────────────────────────────────────────── */}
        <hr className="border-ink-navy/8" />

        {/* ── Contribute / Contact ─────────────────────────────────────────── */}
        <section className="grid gap-10 lg:grid-cols-[1fr_2fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-signal-orange mb-3">Contribute</p>
            <h2 className="font-display text-2xl font-bold text-ink-navy leading-snug">
              Get involved
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-blue">
              We welcome developers, scheme experts, translators, and anyone who wants to help.
            </p>
          </div>
          <div className="divide-y divide-ink-navy/8">
            {[
              {
                title: "Star the repo",
                desc: "Fastest way to show support and improve our GitHub visibility.",
                href: "https://github.com/sridhar0709/Document-analysis",
                label: "github.com/sridhar0709/Document-analysis",
              },
              {
                title: "Report a bug",
                desc: "Found something broken? Open an issue — we track everything there.",
                href: "https://github.com/sridhar0709/Document-analysis/issues",
                label: "Open an issue →",
              },
              {
                title: "Ask a question",
                desc: "GitHub Discussions is the best place to reach us and share ideas.",
                href: "https://github.com/sridhar0709/Document-analysis/discussions",
                label: "Start a discussion →",
              },
              {
                title: "Submit a pull request",
                desc: "Fix bugs, add schemes, improve the UI, or translate content. All PRs are welcome.",
                href: "https://github.com/sridhar0709/Document-analysis/blob/main/CONTRIBUTING.md",
                label: "Read CONTRIBUTING.md →",
              },
              {
                title: "Good first issues",
                desc: "New to the codebase? We tag beginner-friendly issues to get you started.",
                href: "https://github.com/sridhar0709/Document-analysis/issues?q=label%3A%22good+first+issue%22",
                label: "Browse good first issues →",
              },
            ].map((item) => (
              <a
                key={item.title}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start justify-between gap-6 py-5 transition-colors hover:text-ink-navy"
              >
                <div>
                  <h3 className="text-sm font-semibold text-ink-navy group-hover:text-signal-orange transition-colors">{item.title}</h3>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-blue">{item.desc}</p>
                </div>
                <span className="shrink-0 text-xs font-semibold text-signal-orange group-hover:underline underline-offset-2 mt-0.5 whitespace-nowrap">
                  {item.label}
                </span>
              </a>
            ))}
          </div>
        </section>

        {/* ── Disclaimer ───────────────────────────────────────────────────────── */}
        <div className="border-t border-ink-navy/8 pt-8">
          <p className="text-xs leading-relaxed text-slate-blue/70 max-w-2xl">
            <strong className="text-caution-amber font-semibold">Not a Government of India product.</strong>{" "}
            DocLens is not funded by, affiliated with, or endorsed by any government entity. Scheme data is
            sourced from publicly available government publications. Always verify eligibility and application
            procedures with the relevant department before applying.
          </p>
        </div>

      </main>
    </div>
  );
}
