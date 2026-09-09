"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

const tabs = ["Personal", "Location", "Economic", "Account"];

type Profile = {
  full_name: string;
  age: string;
  gender: string;
  state: string;
  district: string;
  annual_income: string;
  occupation: string;
  social_category: string;
  disability_status: string;
  family_size: string;
  has_bpl_card: boolean;
  land_owned_acres: string;
  education_level: string;
  // extra fields stored locally (not in DB but used in UI)
  phone: string;
  dob: string;
  marital_status: string;
  city: string;
  pin: string;
  address: string;
  housing_type: string;
  has_disability: boolean;
};

const EMPTY: Profile = {
  full_name: "",
  age: "",
  gender: "",
  state: "",
  district: "",
  annual_income: "",
  occupation: "",
  social_category: "",
  disability_status: "none",
  family_size: "",
  has_bpl_card: false,
  land_owned_acres: "",
  education_level: "",
  phone: "",
  dob: "",
  marital_status: "",
  city: "",
  pin: "",
  address: "",
  housing_type: "",
  has_disability: false,
};

export default function ProfilePage() {
  const { user } = useAuth();
  const [tab, setTab] = useState(0);
  const [form, setForm] = useState<Profile>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const email: string = user?.email ?? "";
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    : "";

  const displayName = form.full_name || user?.user_metadata?.full_name || "";
  const initials = displayName
    ? displayName.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()
    : email?.[0]?.toUpperCase() ?? "U";

  // Load existing profile
  useEffect(() => {
    if (!user || !supabase) { setLoading(false); return; }
    supabase
      .from("citizen_profiles")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_current", true)
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (err) console.error(err);
        if (data) {
          setForm((prev) => ({
            ...prev,
            full_name: data.full_name ?? "",
            age: (data.age !== undefined && data.age !== null && Number(data.age) !== 0) ? data.age.toString() : "",
            gender: data.gender ?? "",
            state: data.state ?? "",
            district: data.district ?? "",
            annual_income: (data.annual_income !== undefined && data.annual_income !== null && Number(data.annual_income) !== 0) ? data.annual_income.toString() : "",
            occupation: data.occupation ?? "",
            social_category: data.social_category ?? "",
            disability_status: data.disability_status ?? "none",
            family_size: (data.family_size !== undefined && data.family_size !== null && Number(data.family_size) !== 0) ? data.family_size.toString() : "",
            has_bpl_card: data.has_bpl_card ?? false,
            land_owned_acres: (data.land_owned_acres !== undefined && data.land_owned_acres !== null && Number(data.land_owned_acres) !== 0) ? data.land_owned_acres.toString() : "",
            education_level: data.education_level ?? "",
            has_disability: data.disability_status !== "none" && data.disability_status !== "",
          }));
        }
        setLoading(false);
      });
  }, [user]);

  const set = useCallback(<K extends keyof Profile>(key: K, val: Profile[K]) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  }, []);

  async function handleSave() {
    if (!user || !supabase) return;
    setSaving(true);
    setError("");

    const payload = {
      user_id: user.id,
      full_name: form.full_name || (user.user_metadata?.full_name ?? ""),
      age: parseInt(form.age) || 0,
      gender: form.gender || "other",
      state: form.state || "",
      district: form.district || "",
      annual_income: parseFloat(form.annual_income) || 0,
      occupation: form.occupation || "other",
      social_category: form.social_category || "general",
      disability_status: form.has_disability ? (form.disability_status || "yes") : "none",
      family_size: parseInt(form.family_size) || 1,
      has_bpl_card: form.has_bpl_card,
      land_owned_acres: parseFloat(form.land_owned_acres) || 0,
      education_level: form.education_level || "other",
      is_current: true,
    };

    // Upsert: insert if no row for this user, update if one exists
    const { error: upsertErr } = await supabase
      .from("citizen_profiles")
      .upsert(payload, { onConflict: "user_id" });

    if (upsertErr) {
      setError(upsertErr.message);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white to-warm-paper">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-navy/10 border-t-signal-orange" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 bg-gradient-to-b from-white to-warm-paper">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
          {/* Header */}
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-signal-orange/20 to-signal-orange/5 ring-2 ring-signal-orange/20">
              <span className="text-2xl font-bold text-signal-orange">{initials}</span>
            </div>
            <div className="text-center sm:text-left">
              <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-navy">
                {displayName || "Your Profile"}
              </h1>
              <p className="mt-0.5 text-sm text-slate-blue">{email}</p>
              {memberSince && (
                <p className="mt-1 text-xs text-slate-blue-400">Member since {memberSince}</p>
              )}
              {!form.full_name && (
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-caution-amber/10 px-3 py-1 text-xs font-medium text-caution-amber">
                  ⚠ Complete your profile to get scheme matches
                </p>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-8 flex gap-1 rounded-lg bg-ink-navy/5 p-1">
            {tabs.map((t, i) => (
              <button
                key={t}
                onClick={() => setTab(i)}
                className={cn(
                  "flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all",
                  tab === i ? "bg-white text-ink-navy shadow-sm" : "text-slate-blue hover:text-ink-navy"
                )}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="mt-6 space-y-5">
            {/* Personal */}
            {tab === 0 && (
              <div className="rounded-2xl border border-ink-navy/10 bg-white p-6 shadow-sm">
                <h2 className="font-display text-lg font-semibold text-ink-navy">Personal information</h2>
                <p className="mt-1 text-sm text-slate-blue">This data determines which schemes you qualify for.</p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <Input label="Full name" value={form.full_name} onChange={(e) => set("full_name", e.target.value)} placeholder="Your full name" />
                  <Input label="Age" type="number" value={form.age} onChange={(e) => set("age", e.target.value)} placeholder="e.g. 28" />
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-ink-navy">Gender</label>
                    <select value={form.gender} onChange={(e) => set("gender", e.target.value)} className="block w-full rounded-lg border-2 border-ink-navy/15 bg-white px-3.5 py-2.5 text-sm text-ink-navy focus:border-signal-orange focus:outline-none">
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other / Prefer not to say</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-ink-navy">Social category</label>
                    <select value={form.social_category} onChange={(e) => set("social_category", e.target.value)} className="block w-full rounded-lg border-2 border-ink-navy/15 bg-white px-3.5 py-2.5 text-sm text-ink-navy focus:border-signal-orange focus:outline-none">
                      <option value="">Select category</option>
                      <option value="general">General</option>
                      <option value="obc">OBC</option>
                      <option value="sc">SC</option>
                      <option value="st">ST</option>
                      <option value="ews">EWS</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-ink-navy">Education level</label>
                    <select value={form.education_level} onChange={(e) => set("education_level", e.target.value)} className="block w-full rounded-lg border-2 border-ink-navy/15 bg-white px-3.5 py-2.5 text-sm text-ink-navy focus:border-signal-orange focus:outline-none">
                      <option value="">Select level</option>
                      <option value="none">No formal education</option>
                      <option value="primary">Primary (up to 5th)</option>
                      <option value="middle">Middle (up to 8th)</option>
                      <option value="secondary">Secondary (10th)</option>
                      <option value="higher_secondary">Higher Secondary (12th)</option>
                      <option value="graduate">Graduate</option>
                      <option value="postgraduate">Post Graduate</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <Input label="Family size" type="number" value={form.family_size} onChange={(e) => set("family_size", e.target.value)} placeholder="Number of family members" />
                </div>
              </div>
            )}

            {/* Location */}
            {tab === 1 && (
              <div className="rounded-2xl border border-ink-navy/10 bg-white p-6 shadow-sm">
                <h2 className="font-display text-lg font-semibold text-ink-navy">Location</h2>
                <p className="mt-1 text-sm text-slate-blue">State and district determine state-specific scheme eligibility.</p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-ink-navy">State</label>
                    <select value={form.state} onChange={(e) => set("state", e.target.value)} className="block w-full rounded-lg border-2 border-ink-navy/15 bg-white px-3.5 py-2.5 text-sm text-ink-navy focus:border-signal-orange focus:outline-none">
                      <option value="">Select state</option>
                      {["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Jammu & Kashmir","Ladakh"].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <Input label="District" value={form.district} onChange={(e) => set("district", e.target.value)} placeholder="Your district" />
                </div>
              </div>
            )}

            {/* Economic */}
            {tab === 2 && (
              <div className="rounded-2xl border border-ink-navy/10 bg-white p-6 shadow-sm">
                <h2 className="font-display text-lg font-semibold text-ink-navy">Economic indicators</h2>
                <p className="mt-1 text-sm text-slate-blue">Used for means-tested scheme eligibility calculations.</p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <Input label="Annual household income (₹)" type="number" value={form.annual_income} onChange={(e) => set("annual_income", e.target.value)} placeholder="e.g. 300000" hint="Total income from all sources" />
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-ink-navy">Occupation</label>
                    <select value={form.occupation} onChange={(e) => set("occupation", e.target.value)} className="block w-full rounded-lg border-2 border-ink-navy/15 bg-white px-3.5 py-2.5 text-sm text-ink-navy focus:border-signal-orange focus:outline-none">
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
                  <Input label="Land owned (acres)" type="number" value={form.land_owned_acres} onChange={(e) => set("land_owned_acres", e.target.value)} placeholder="0 if none" />
                </div>
                <div className="mt-5 space-y-3 border-t border-ink-navy/10 pt-5">
                  <label className="flex items-center gap-3 rounded-lg bg-warm-paper/50 px-4 py-3 cursor-pointer">
                    <input type="checkbox" checked={form.has_bpl_card} onChange={(e) => set("has_bpl_card", e.target.checked)} className="h-4 w-4 rounded border-ink-navy/20 accent-signal-orange" />
                    <span className="text-sm text-ink-navy">BPL (Below Poverty Line) ration card holder</span>
                  </label>
                  <label className="flex items-center gap-3 rounded-lg bg-warm-paper/50 px-4 py-3 cursor-pointer">
                    <input type="checkbox" checked={form.has_disability} onChange={(e) => set("has_disability", e.target.checked)} className="h-4 w-4 rounded border-ink-navy/20 accent-signal-orange" />
                    <span className="text-sm text-ink-navy">Certified disability (40% or more)</span>
                  </label>
                </div>
              </div>
            )}

            {/* Account */}
            {tab === 3 && (
              <div className="space-y-5">
                <div className="rounded-2xl border border-ink-navy/10 bg-white p-6 shadow-sm">
                  <h2 className="font-display text-lg font-semibold text-ink-navy">Account security</h2>
                  <p className="mt-1 text-sm text-slate-blue">Your login email.</p>
                  <div className="mt-5">
                    <Input label="Email" type="email" value={email} readOnly />
                    <p className="mt-2 text-xs text-slate-blue-400">To change your email or password, use the Supabase dashboard or contact support.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Save bar */}
            {error && (
              <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
            )}
            {tab !== 3 && (
              <div className="sticky bottom-0 flex items-center justify-between rounded-2xl border border-ink-navy/10 bg-white/95 p-4 shadow-lg backdrop-blur-sm">
                <p className="text-xs text-slate-blue-400">
                  {saved ? "✓ Saved! Eligibility matching will re-run." : "Changes will re-run eligibility matching against all schemes."}
                </p>
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  {saving ? "Saving…" : saved ? "Saved ✓" : "Save changes"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
