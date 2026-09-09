"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

export default function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const redirectPath =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("redirect") || "/dashboard"
        : "/dashboard";
    const result = await signIn(email, password, redirectPath);
    setBusy(false);
    if (result.error) {
      if (
        result.error.toLowerCase().includes("invalid login credentials") ||
        result.error.toLowerCase().includes("invalid_grant") ||
        result.error.toLowerCase().includes("email not confirmed")
      ) {
        setError("Invalid credentials or email not verified.");
      } else {
        setError(result.error);
      }
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex flex-1">
        <div className="flex w-full flex-col lg:flex-row">
          {/* Brand panel */}
          <div className="relative hidden flex-1 items-center justify-center overflow-hidden bg-gradient-to-br from-[#3730A3] via-[#1E1B4B] to-[#312E81] lg:flex">
            <div className="pointer-events-none absolute -right-20 -top-20 h-[500px] w-[500px] rounded-full bg-signal-orange/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-[400px] w-[400px] rounded-full bg-verified-teal/10 blur-3xl" />
            <div className="relative px-12 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm">
                <img src="/assets/logo-bg.png" alt="DocLens" className="h-full w-full object-contain" loading="lazy" />
              </div>
              <h2 className="mt-6 font-display text-3xl font-semibold text-white">DocLens</h2>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/60">
                Find every government welfare scheme you qualify for. One profile, all schemes — from central to state.
              </p>
            </div>
          </div>

          {/* Form panel */}
          <div className="flex flex-1 items-center justify-center px-4 py-12">
            <div className="w-full max-w-sm">
              <div className="text-center lg:hidden">
                <div className="mx-auto flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-ink-navy/10">
                  <img src="/assets/logo-bg.png" alt="DocLens Logo" className="h-full w-full object-contain" loading="lazy" />
                </div>
                <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight text-ink-navy">Welcome back</h1>
                <p className="mt-1 text-sm text-slate-blue">Sign in to check your schemes</p>
              </div>

              <div className="hidden lg:block">
                <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-navy">Welcome back</h1>
                <p className="mt-1 text-sm text-slate-blue">Sign in to check your schemes</p>
              </div>

              <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Input
                  label="Password"
                  type="password"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                {error && (
                  <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5 leading-relaxed">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Signing in…" : "Sign in"}
                </Button>
              </form>

              <p className="mt-8 text-center text-sm text-slate-blue">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="font-semibold text-signal-orange transition-colors hover:text-signal-orange-600">Create one</Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
