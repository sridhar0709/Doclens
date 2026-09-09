"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Footer() {
  return (
    <footer className="relative bg-[#0F172A] text-slate-300 border-t border-[#1E1B4B] mt-auto">
      {/* ── Top tricolour accent stripe ─────────────────────────────────── */}
      <div className="h-1 w-full bg-gradient-to-r from-orange-500 via-amber-400 to-teal-400" />

      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-14 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-12 mb-12">
          
          {/* ── Brand & Mission (Col 1-5) ───────────────────────────────── */}
          <div className="md:col-span-5 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 border border-white/15 p-1 shadow-inner group-hover:border-orange-400/50 transition-colors">
                <img src="/assets/logo-bg.png" alt="DocLens Logo" className="w-7 h-7 object-contain" />
              </div>
              <span className="font-display font-extrabold text-xl text-white tracking-tight group-hover:text-orange-400 transition-colors">
                Doc<span className="text-orange-400">Lens</span>
              </span>
            </Link>
            
            <p className="text-slate-300 text-sm leading-relaxed max-w-sm">
              An AI-powered welfare discovery engine simplifying access to government benefits across India. Open-source, transparent, and built to empower every citizen.
            </p>

            <div className="pt-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3.5 py-1.5 text-xs font-semibold text-teal-300 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
                🇮🇳 Empowering Citizens Nationwide
              </span>
            </div>
          </div>

          {/* ── Platform Links (Col 6-7) ────────────────────────────────── */}
          <div className="md:col-span-2 md:col-start-7 space-y-4">
            <h4 className="font-bold text-xs tracking-wider uppercase text-white font-display">
              Platform
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/schemes" className="text-slate-300 hover:text-orange-400 hover:translate-x-0.5 inline-block transition-all duration-200">
                  Browse Schemes
                </Link>
              </li>
              <li>
                <Link href="/documents" className="text-slate-300 hover:text-orange-400 hover:translate-x-0.5 inline-block transition-all duration-200">
                  Document Vault
                </Link>
              </li>
              <li>
                <Link href="/chat" className="text-slate-300 hover:text-orange-400 hover:translate-x-0.5 inline-block transition-all duration-200">
                  AI Assistant
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-slate-300 hover:text-orange-400 hover:translate-x-0.5 inline-block transition-all duration-200">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* ── Citizens Links (Col 8-9) ────────────────────────────────── */}
          <div className="md:col-span-2 space-y-4">
            <h4 className="font-bold text-xs tracking-wider uppercase text-white font-display">
              Citizens
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/register" className="text-slate-300 hover:text-orange-400 hover:translate-x-0.5 inline-block transition-all duration-200">
                  Eligibility Check
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-slate-300 hover:text-orange-400 hover:translate-x-0.5 inline-block transition-all duration-200">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="text-slate-300 hover:text-orange-400 hover:translate-x-0.5 inline-block transition-all duration-200">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/profile" className="text-slate-300 hover:text-orange-400 hover:translate-x-0.5 inline-block transition-all duration-200">
                  Citizen Profile
                </Link>
              </li>
            </ul>
          </div>

          {/* ── Open Source (Col 10-12) ─────────────────────────────────── */}
          <div className="md:col-span-3 space-y-4">
            <h4 className="font-bold text-xs tracking-wider uppercase text-white font-display">
              Open Source
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href="https://github.com/sridhar0709/Document-analysis"
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-300 hover:text-orange-400 hover:translate-x-0.5 inline-flex items-center gap-1.5 transition-all duration-200"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                  GitHub Repository
                </a>
              </li>
              <li>
                <Link href="/privacy" className="text-slate-300 hover:text-orange-400 hover:translate-x-0.5 inline-block transition-all duration-200">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-slate-300 hover:text-orange-400 hover:translate-x-0.5 inline-block transition-all duration-200">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* ── Bottom Bar ──────────────────────────────────────────────── */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© 2026 DocLens. All rights reserved. Open-source welfare discovery for India.</p>
          <div className="flex items-center gap-6">
            <span className="inline-flex items-center gap-1.5 text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              All Systems Operational
            </span>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}

export default Footer;
