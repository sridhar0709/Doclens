"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CitizenProfile } from "@/lib/api";

const steps = ["Account", "Demographics", "Economic", "Review"];

export default function RegisterPage() {
  const { signUp, signOut } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    email: "", password: "", full_name: "",
    age: "", gender: "" as any,
    state: "", district: "",
    annual_income: "", occupation: "" as any,
    social_category: "" as any,
    disability_status: "none" as any,
    family_size: "", has_bpl_card: false,
    land_owned_acres: "", education_level: "" as any,
  });

  useEffect(() => {
    try {
      const rgEls = pageRef.current?.querySelectorAll(".rg-hero, .rg-card");
      if (rgEls?.length) gsap.killTweensOf(rgEls);
      const ctx = gsap.context(() => {
        gsap.fromTo(".rg-hero", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out", clearProps: "all" });
        gsap.fromTo(".rg-card", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, delay: 0.15, ease: "power2.out", clearProps: "all" });
      }, pageRef);
      return () => ctx.revert();
    } catch { return; }
  }, []);

  async function handleSubmit() {
    setError("");
    setBusy(true);

    const calculateAge = (dobString: string): number => {
      if (!dobString) return 0;
      const birthDate = new Date(dobString);
      if (isNaN(birthDate.getTime())) return 0;
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    };

    const calculatedAge = calculateAge(form.age);

    const profileData = {
      full_name: form.full_name,
      age: calculatedAge,
      gender: form.gender || "other",
      state: form.state || "",
      district: form.district || "",
      annual_income: parseFloat(form.annual_income) || 0,
      occupation: form.occupation || "other",
      social_category: form.social_category || "general",
      disability_status: form.disability_status || "none",
      family_size: parseInt(form.family_size) || 1,
      has_bpl_card: form.has_bpl_card,
      land_owned_acres: parseFloat(form.land_owned_acres) || 0,
      education_level: form.education_level || "other",
    };

    const { error: signUpError, data } = await signUp(form.email, form.password, form.full_name, profileData);
    if (signUpError) {
      setError(signUpError);
      setBusy(false);
      return;
    }

    if (data?.user && supabase) {
      const payload = {
        user_id: data.user.id,
        ...profileData,
        is_current: true,
      };
      try {
        await supabase.from("citizen_profiles").upsert(payload, { onConflict: "user_id" });
      } catch (err) {
        console.error("Direct profile upsert failed, relying on trigger/self-heal fallback:", err);
      }
    }

    setSubmitted(true);
    setBusy(false);

    // Completely flush any auto-login session from registration and redirect to login
    setTimeout(async () => {
      await signOut("/login");
    }, 2000);
  }

  function update<T extends keyof typeof form>(key: T, value: (typeof form)[T]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const canProceed = () => {
    if (step === 0) return form.email && form.password.length >= 6 && form.full_name;
    if (step === 1) return form.age && form.district && form.gender && form.social_category && form.state;
    if (step === 2) return form.annual_income && form.education_level && form.occupation && form.family_size;
    return true;
  };

  return (
    <div ref={pageRef} className="flex min-h-screen flex-col">
      <main className="flex flex-1 items-center justify-center bg-gradient-to-b from-white to-warm-paper px-4 py-12">
        <div className="w-full max-w-lg">
          <div className="rg-hero text-center sm:text-left">
            <div className="mx-auto flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-ink-navy/10 sm:mx-0">
              <img src="/assets/logo-bg.png" alt="DocLens" className="h-full w-full object-contain" loading="lazy" />
            </div>
            <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight text-ink-navy">Create your account</h1>
            <p className="mt-1 text-sm text-slate-blue">Fill in your details once. We match you against every scheme.</p>
          </div>

          {/* Progress bar */}
          <div className="rg-card mt-8">
            <div className="flex items-center justify-between">
              {steps.map((s, i) => (
                <div key={s} className="flex items-center">
                  {i > 0 && <div className={cn("h-0.5 w-8 sm:w-16", i <= step ? "bg-signal-orange" : "bg-ink-navy/10")} />}
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all sm:h-9 sm:w-9",
                    i < step ? "bg-signal-orange text-white shadow-sm" : i === step ? "border-2 border-signal-orange bg-signal-orange/10 text-signal-orange" : "border-2 border-ink-navy/15 bg-white text-slate-blue-400"
                  )}>
                    {i < step ? <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path d="M5 13l4 4L19 7" /></svg> : i + 1}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between px-0.5">
              {steps.map((s, i) => (
                <span key={s} className={cn("hidden text-xs font-medium sm:block", i === step ? "text-signal-orange" : "text-slate-blue-400")}>{s}</span>
              ))}
            </div>
          </div>

          {submitted ? (
            <div className="rg-card mt-6 rounded-2xl border border-verified-teal/20 bg-white p-8 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-verified-teal/10">
                <svg className="h-6 w-6 text-verified-teal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M5 13l4 4L19 7" /></svg>
              </div>
              <h2 className="mt-4 font-display text-xl font-semibold text-ink-navy">Account created!</h2>
              <p className="mt-2 text-sm text-slate-blue">Check your email to confirm your account, then sign in to complete your profile.</p>
            </div>
          ) : (
            <div className="rg-card mt-6 rounded-2xl border border-ink-navy/10 bg-white p-6 shadow-sm sm:p-8">
              {step === 0 && (
                <div className="space-y-4">
                  <h2 className="font-display text-xl font-semibold text-ink-navy">Create your account</h2>
                  <p className="text-sm text-slate-blue">You&apos;ll use this to access your dashboard.</p>
                  <Input label="Full name" placeholder="As on Aadhaar" autoComplete="off" value={form.full_name} onChange={(e) => update("full_name", e.target.value)} />
                  <Input label="Email" type="email" placeholder="you@example.com" autoComplete="new-email" value={form.email} onChange={(e) => update("email", e.target.value)} />
                  <Input label="Password" type="password" placeholder="At least 6 characters" autoComplete="new-password" value={form.password} onChange={(e) => update("password", e.target.value)} />
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <h2 className="font-display text-xl font-semibold text-ink-navy">About you</h2>
                  <p className="text-sm text-slate-blue">Basic details help us find the right schemes.</p>
                  <Input label="Date of birth" type="date" value={form.age} onChange={(e) => update("age", e.target.value)} />
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-ink-navy">Gender</label>
                    <select className="block w-full rounded-lg border-2 border-ink-navy/15 bg-white px-3.5 py-2.5 text-sm text-ink-navy focus:border-signal-orange focus:outline-none" value={form.gender} onChange={(e) => update("gender", e.target.value as CitizenProfile["gender"])}>
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-ink-navy">Social category</label>
                    <select className="block w-full rounded-lg border-2 border-ink-navy/15 bg-white px-3.5 py-2.5 text-sm text-ink-navy focus:border-signal-orange focus:outline-none" value={form.social_category} onChange={(e) => update("social_category", e.target.value as CitizenProfile["social_category"])}>
                      <option value="">Select category</option>
                      <option value="general">General</option><option value="obc">OBC</option><option value="sc">SC</option><option value="st">ST</option><option value="ews">EWS</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-ink-navy">State of residence</label>
                    <select className="block w-full rounded-lg border-2 border-ink-navy/15 bg-white px-3.5 py-2.5 text-sm text-ink-navy focus:border-signal-orange focus:outline-none" value={form.state} onChange={(e) => update("state", e.target.value)}>
                      <option value="">Select state</option>
                      <option>Andhra Pradesh</option><option>Arunachal Pradesh</option><option>Assam</option><option>Bihar</option>
                      <option>Chhattisgarh</option><option>Goa</option><option>Gujarat</option><option>Haryana</option>
                      <option>Himachal Pradesh</option><option>Jharkhand</option><option>Karnataka</option><option>Kerala</option>
                      <option>Madhya Pradesh</option><option>Maharashtra</option><option>Manipur</option><option>Meghalaya</option>
                      <option>Mizoram</option><option>Nagaland</option><option>Odisha</option><option>Punjab</option>
                      <option>Rajasthan</option><option>Sikkim</option><option>Tamil Nadu</option><option>Telangana</option>
                      <option>Tripura</option><option>Uttar Pradesh</option><option>Uttarakhand</option><option>West Bengal</option>
                      <option disabled>──────────</option>
                      <option>Andaman &amp; Nicobar Islands</option><option>Chandigarh</option><option>Dadra &amp; Nagar Haveli &amp; Daman &amp; Diu</option>
                      <option>Delhi</option><option>Jammu &amp; Kashmir</option><option>Ladakh</option><option>Lakshadweep</option>
                      <option>Puducherry</option>
                    </select>
                  </div>
                  <Input label="District" placeholder="e.g. Cuttack" value={form.district} onChange={(e) => update("district", e.target.value)} />
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <h2 className="font-display text-xl font-semibold text-ink-navy">Economic indicators</h2>
                  <p className="text-sm text-slate-blue">Used to determine means-tested scheme eligibility.</p>
                  <Input label="Annual household income (₹)" type="number" placeholder="e.g. 300000" value={form.annual_income} onChange={(e) => update("annual_income", e.target.value)} />
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-ink-navy">Occupation</label>
                    <select className="block w-full rounded-lg border-2 border-ink-navy/15 bg-white px-3.5 py-2.5 text-sm text-ink-navy focus:border-signal-orange focus:outline-none" value={form.occupation} onChange={(e) => update("occupation", e.target.value as CitizenProfile["occupation"] | "")}>
                      <option value="">Select occupation</option>
                      <option value="farmer">Farmer</option>
                      <option value="daily_wage">Daily wage worker</option>
                      <option value="self_employed">Self-employed</option>
                      <option value="salaried">Salaried</option>
                      <option value="student">Student</option>
                      <option value="unemployed">Unemployed</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-ink-navy">Education level</label>
                    <select className="block w-full rounded-lg border-2 border-ink-navy/15 bg-white px-3.5 py-2.5 text-sm text-ink-navy focus:border-signal-orange focus:outline-none" value={form.education_level} onChange={(e) => update("education_level", e.target.value as CitizenProfile["education_level"] | "")}>
                      <option value="">Select education level</option>
                      <option value="none">No formal education</option>
                      <option value="primary">Primary</option>
                      <option value="secondary">Secondary</option>
                      <option value="higher_secondary">Higher secondary</option>
                      <option value="graduate">Graduate</option>
                      <option value="postgraduate">Postgraduate</option>
                    </select>
                  </div>
                  <Input label="Family size" type="number" placeholder="e.g. 4" value={form.family_size} onChange={(e) => update("family_size", e.target.value)} />
                  <Input label="Land owned (acres)" type="number" placeholder="e.g. 2" value={form.land_owned_acres} onChange={(e) => update("land_owned_acres", e.target.value)} />
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 rounded-lg bg-warm-paper/50 px-4 py-3">
                      <input type="checkbox" className="h-4 w-4 rounded border-ink-navy/20 text-signal-orange focus:ring-signal-orange" checked={form.has_bpl_card} onChange={(e) => update("has_bpl_card", e.target.checked)} />
                      <span className="text-sm text-ink-navy">I have a BPL (Below Poverty Line) ration card</span>
                    </label>
                    <label className="flex items-center gap-3 rounded-lg bg-warm-paper/50 px-4 py-3">
                      <select className="text-sm border-0 bg-transparent focus:ring-0" value={form.disability_status} onChange={(e) => update("disability_status", e.target.value as CitizenProfile["disability_status"])}>
                        <option value="none">No disability</option>
                        <option value="physical">Physical disability (40%+)</option>
                        <option value="visual">Visual impairment</option>
                        <option value="hearing">Hearing impairment</option>
                        <option value="multiple">Multiple disabilities</option>
                      </select>
                    </label>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <h2 className="font-display text-xl font-semibold text-ink-navy">Review your profile</h2>
                  <p className="text-sm text-slate-blue">You can edit any detail later from your profile page.</p>
                  <div className="rounded-xl border border-ink-navy/10 bg-warm-paper/50 divide-y divide-ink-navy/8 overflow-hidden">
                    {[
                      { label: "Name", value: form.full_name },
                      { label: "Email", value: form.email },
                      { label: "District", value: form.district },
                      { label: "State", value: form.state },
                      { label: "Annual income", value: `₹${Number(form.annual_income).toLocaleString()}` },
                      { label: "Occupation", value: form.occupation },
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between px-4 py-3 text-sm">
                        <span className="text-slate-blue-400">{item.label}</span>
                        <span className="font-medium text-ink-navy">{item.value}</span>
                      </div>
                    ))}
                  </div>

                  {error && (
                    <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
                  )}

                  <div className="rounded-xl bg-verified-teal/5 px-4 py-3">
                    <div className="flex items-start gap-3">
                      <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-verified-teal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <p className="text-xs text-slate-blue">Your data is encrypted and never shared. By creating an account, you agree to our Terms of Service and Privacy Policy.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="mt-6 flex justify-between">
                {step > 0 ? (
                  <Button variant="ghost" onClick={() => setStep(step - 1)} disabled={busy}>
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                    Back
                  </Button>
                ) : <div />}
                {step < steps.length - 1 ? (
                  <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
                    Continue
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={busy}>
                    {busy ? "Creating account…" : "Create account"}
                  </Button>
                )}
              </div>
            </div>
          )}

          <p className="mt-6 text-center text-sm text-slate-blue">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-signal-orange transition-colors hover:text-signal-orange-600">Sign in</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
