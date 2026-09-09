"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/ui/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { submitIntake } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { createBrowserClient } from "@supabase/ssr";
import { getCategoryInfo } from "@/lib/categories";

interface CitizenProfileForm {
  full_name: string;
  age: number;
  gender: string;
  state: string;
  district: string;
  annual_income: number;
  occupation: string;
  social_category: string;
  disability_status: string;
  family_size: number;
  has_bpl_card: boolean;
  land_owned_acres: number;
  education_level: string;
  gov_id_available: {
    aadhaar: boolean;
    pan: boolean;
    voter_id: boolean;
    driving_license: boolean;
    ration_card: boolean;
    passport: boolean;
    income_certificate: boolean;
    caste_certificate: boolean;
    domicile_certificate: boolean;
    disability_certificate: boolean;
  };
}

const PRESET_PROFILES: Record<string, { label: string; icon: string; description: string; data: CitizenProfileForm }> = {
  farmer: {
    label: "Rural Farmer (UP)",
    icon: "🌾",
    description: "Smallholder farmer in Uttar Pradesh seeking agricultural support & MGNREGA benefits.",
    data: {
      full_name: "Ram Khelawan Yadav",
      age: 42,
      gender: "male",
      state: "Uttar Pradesh",
      district: "Varanasi",
      annual_income: 85000,
      occupation: "farmer",
      social_category: "obc",
      disability_status: "none",
      family_size: 5,
      has_bpl_card: true,
      land_owned_acres: 2.5,
      education_level: "secondary",
      gov_id_available: {
        aadhaar: true,
        pan: false,
        voter_id: true,
        driving_license: false,
        ration_card: true,
        passport: false,
        income_certificate: true,
        caste_certificate: true,
        domicile_certificate: true,
        disability_certificate: false,
      },
    },
  },
  student: {
    label: "Student Scholar (Gujarat)",
    icon: "🎓",
    description: "College student in Ahmedabad seeking higher education scholarships and financial aid.",
    data: {
      full_name: "Priya Patel",
      age: 19,
      gender: "female",
      state: "Gujarat",
      district: "Ahmedabad",
      annual_income: 180000,
      occupation: "student",
      social_category: "general",
      disability_status: "none",
      family_size: 4,
      has_bpl_card: false,
      land_owned_acres: 0,
      education_level: "graduate",
      gov_id_available: {
        aadhaar: true,
        pan: true,
        voter_id: true,
        driving_license: false,
        ration_card: false,
        passport: false,
        income_certificate: true,
        caste_certificate: false,
        domicile_certificate: true,
        disability_certificate: false,
      },
    },
  },
  entrepreneur: {
    label: "Self-Employed / SHG (Tamil Nadu)",
    icon: "👩‍💼",
    description: "Women entrepreneur in Chennai seeking micro-credit, SHG schemes, and skill training.",
    data: {
      full_name: "Lakshmi Raman",
      age: 28,
      gender: "female",
      state: "Tamil Nadu",
      district: "Chennai",
      annual_income: 140000,
      occupation: "self_employed",
      social_category: "obc",
      disability_status: "none",
      family_size: 3,
      has_bpl_card: false,
      land_owned_acres: 0,
      education_level: "higher_secondary",
      gov_id_available: {
        aadhaar: true,
        pan: true,
        voter_id: true,
        driving_license: true,
        ration_card: true,
        passport: false,
        income_certificate: true,
        caste_certificate: true,
        domicile_certificate: true,
        disability_certificate: false,
      },
    },
  },
  housing: {
    label: "Urban Housing Applicant (MH)",
    icon: "🏠",
    description: "Salaried worker in Mumbai seeking PMAY-Urban affordable housing subsidy.",
    data: {
      full_name: "Vikram Deshmukh",
      age: 35,
      gender: "male",
      state: "Maharashtra",
      district: "Mumbai",
      annual_income: 380000,
      occupation: "salaried",
      social_category: "general",
      disability_status: "none",
      family_size: 4,
      has_bpl_card: false,
      land_owned_acres: 0,
      education_level: "postgraduate",
      gov_id_available: {
        aadhaar: true,
        pan: true,
        voter_id: true,
        driving_license: true,
        ration_card: false,
        passport: true,
        income_certificate: true,
        caste_certificate: false,
        domicile_certificate: true,
        disability_certificate: false,
      },
    },
  },
};

export default function TestAgentsPage() {
  const { session } = useAuth();
  const [profile, setProfile] = useState<CitizenProfileForm>(PRESET_PROFILES.farmer.data);
  const [activePreset, setActivePreset] = useState("farmer");
  const [backendHealth, setBackendHealth] = useState<{ status: string; scheme_count?: number; llm_active?: boolean; backend_url: string } | null>(null);
  const [healthChecking, setHealthChecking] = useState(true);

  // Pipeline execution state
  const [running, setRunning] = useState(false);
  const [stepProgress, setStepProgress] = useState(0); // 0 to 4
  const [result, setResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [activeTab, setActiveTab] = useState<"schemes" | "docgap" | "normalized" | "raw">("schemes");

  useEffect(() => {
    checkBackendHealth();
  }, []);

  async function checkBackendHealth() {
    setHealthChecking(true);
    const baseHost = (process.env.NEXT_PUBLIC_API_URL || "https://doclens-backend.onrender.com").replace(/\/api\/?$/, "").replace(/\/$/, "");
    const apiUrl = `${baseHost}/api`;
    try {
      const res = await fetch(`${apiUrl}/health`);
      if (res.ok) {
        const data = await res.json();
        setBackendHealth({
          status: "online",
          scheme_count: data.scheme_count ?? 4702,
          llm_active: data.llm_active ?? false,
          backend_url: apiUrl,
        });
      } else {
        setBackendHealth({ status: "error", backend_url: apiUrl });
      }
    } catch {
      setBackendHealth({ status: "offline", backend_url: apiUrl });
    } finally {
      setHealthChecking(false);
    }
  }

  function handleSelectPreset(key: string) {
    setActivePreset(key);
    setProfile(PRESET_PROFILES[key].data);
    setResult(null);
    setStepProgress(0);
  }

  async function runAgentPipeline() {
    setRunning(true);
    setResult(null);
    setErrorMsg("");
    setStepProgress(1); // Intake Agent started

    try {
      // Get the freshest possible session token
      let token = session?.access_token || "";
      if (!token) {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data } = await supabase.auth.getSession();
        token = data.session?.access_token || "";
      }
      if (!token) {
        setErrorMsg("⚠️ You must be logged in to run the agent pipeline. Please log in and return to this page.");
        setRunning(false);
        setStepProgress(0);
        return;
      }

      const stepTimer1 = setTimeout(() => setStepProgress(2), 600); // Eligibility Agent
      const stepTimer2 = setTimeout(() => setStepProgress(3), 1300); // Ranking Agent
      const stepTimer3 = setTimeout(() => setStepProgress(4), 2000); // DocGap Agent

      const cleanPayload = {
        full_name: profile.full_name || "Test Candidate",
        age: Number(profile.age) || 30,
        gender: profile.gender || "male",
        state: profile.state || "Uttar Pradesh",
        district: profile.district || "Varanasi",
        annual_income: Number(profile.annual_income) || 0,
        occupation: profile.occupation === "salaried_private" ? "salaried" : profile.occupation || "other",
        social_category: profile.social_category || "general",
        disability_status: profile.disability_status || "none",
        family_size: Number(profile.family_size) || 1,
        has_bpl_card: Boolean(profile.has_bpl_card),
        land_owned_acres: Number(profile.land_owned_acres) || 0,
        education_level:
          profile.education_level === "below_10th" || profile.education_level === "10th_pass"
            ? "secondary"
            : profile.education_level === "12th_pass"
            ? "higher_secondary"
            : profile.education_level === "post_graduate"
            ? "postgraduate"
            : profile.education_level || "graduate",
        gov_id_available: {
          aadhaar: Boolean(profile.gov_id_available?.aadhaar),
          income_certificate: Boolean(profile.gov_id_available?.income_certificate),
          caste_certificate: Boolean(profile.gov_id_available?.caste_certificate),
          ration_card: Boolean(profile.gov_id_available?.ration_card),
        },
      };

      const response = await submitIntake(token, cleanPayload as any);
      
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      setStepProgress(4);

      if (response && response.processing_status === "success") {
        setResult(response);
      } else if (response && response.error_message) {
        setErrorMsg(response.error_message);
      } else {
        setResult(response);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to execute multi-agent pipeline. Check connection to backend.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-10">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-[#1E1B4B] via-[#4C1D95] to-[#4338CA] rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden border border-white/10">
          <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-signal-orange/15 blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -top-20 w-80 h-80 rounded-full bg-verified-teal/15 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-semibold uppercase tracking-wider text-orange-300 mb-4 backdrop-blur-md">
                <span>⚡ Live Multi-Agent Diagnostic Lab</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-display">
                Simulate & Inspect AI Srithi Agents
              </h1>
              <p className="mt-3 text-slate-200 text-sm sm:text-base max-w-2xl leading-relaxed">
                Test how our 4 specialized AI agents normalize profiles, evaluate deterministic eligibility rules across{" "}
                <span className="font-bold text-white">4,702 government schemes</span>, rank priorities, and detect missing document gaps in real time.
              </p>
            </div>

            {/* Backend Health Status Card */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4.5 min-w-[260px] text-left">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-300">Backend Engine</span>
                <button
                  onClick={checkBackendHealth}
                  disabled={healthChecking}
                  className="text-[11px] font-bold text-orange-300 hover:text-orange-200 underline"
                >
                  {healthChecking ? "Checking..." : "Refresh Status"}
                </button>
              </div>
              <div className="mt-2.5 flex items-center gap-2.5">
                {healthChecking ? (
                  <span className="h-3 w-3 rounded-full bg-amber-400 animate-pulse" />
                ) : backendHealth?.status === "online" ? (
                  <span className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                ) : (
                  <span className="h-3 w-3 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.8)]" />
                )}
                <span className="font-bold text-sm">
                  {healthChecking
                    ? "Connecting..."
                    : backendHealth?.status === "online"
                    ? `Live (${backendHealth.scheme_count?.toLocaleString()} Schemes)`
                    : "Offline / Unreachable"}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-300 font-mono truncate max-w-[230px]" title={backendHealth?.backend_url || ""}>
                {backendHealth?.backend_url || "https://doclens-backend.onrender.com/api"}
              </p>
            </div>
          </div>
        </div>

        {/* 4 Agents Architecture Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-extrabold text-base">
                  1️⃣
                </span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Online
                </span>
              </div>
              <h3 className="font-bold text-[#1E1B4B] text-base">Intake Agent</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Normalizes raw citizen input, formats numerical brackets, and cleans demographic & ID strings.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 text-[11px] font-mono text-gray-400">
              agents/intake_agent.py
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="h-9 w-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-extrabold text-base">
                  2️⃣
                </span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Online
                </span>
              </div>
              <h3 className="font-bold text-[#1E1B4B] text-base">Eligibility Agent</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Evaluates deterministic rules (age, income, occupation, state) across all 4,702 welfare schemes.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 text-[11px] font-mono text-gray-400">
              agents/eligibility_agent.py
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-extrabold text-base">
                  3️⃣
                </span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Online
                </span>
              </div>
              <h3 className="font-bold text-[#1E1B4B] text-base">Ranking Agent</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Prioritizes eligible schemes by financial benefit estimate (`₹ value`) and social priority ranking.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 text-[11px] font-mono text-gray-400">
              agents/ranking_agent.py
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="h-9 w-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-extrabold text-base">
                  4️⃣
                </span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Online
                </span>
              </div>
              <h3 className="font-bold text-[#1E1B4B] text-base">DocGap Agent</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Cross-references required scheme docs against available IDs to output actionable missing checklists.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 text-[11px] font-mono text-gray-400">
              agents/docgap_agent.py
            </div>
          </div>
        </div>

        {/* Preset Profiles & Simulation Trigger */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Preset Selector & Profile Editor */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-[#1E1B4B] font-display flex items-center gap-2">
                <span>1. Select Test Profile</span>
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Choose a preset demographic candidate or customize fields to test how agents evaluate different citizens.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(PRESET_PROFILES).map(([key, preset]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSelectPreset(key)}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    activePreset === key
                      ? "border-orange-500 bg-orange-50/70 ring-2 ring-orange-500/20 shadow-sm"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50"
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm text-[#1E1B4B]">
                    <span>{preset.icon}</span>
                    <span className="truncate">{preset.label}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1 line-clamp-2 leading-tight">
                    {preset.description}
                  </p>
                </button>
              ))}
            </div>

            {/* Quick Profile Parameters Preview/Edit */}
            <div className="pt-4 border-t border-gray-100 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Selected Profile Parameters</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-gray-600">Full Name</label>
                  <Input
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    className="mt-1 text-xs h-9"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-600">State / District</label>
                  <div className="flex gap-1 mt-1">
                    <Input
                      value={profile.state}
                      onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                      className="text-xs h-9"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-600">Annual Income (₹)</label>
                  <Input
                    type="number"
                    value={profile.annual_income}
                    onChange={(e) => setProfile({ ...profile, annual_income: Number(e.target.value) })}
                    className="mt-1 text-xs h-9"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-600">Occupation</label>
                  <select
                    value={profile.occupation}
                    onChange={(e) => setProfile({ ...profile, occupation: e.target.value })}
                    className="mt-1 w-full h-9 rounded-xl border border-gray-200 bg-white px-2.5 text-xs text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  >
                    <option value="farmer">Farmer</option>
                    <option value="student">Student</option>
                    <option value="self_employed">Self Employed / SHG</option>
                    <option value="salaried">Salaried (Private)</option>
                    <option value="unemployed">Unemployed</option>
                    <option value="daily_wage">Daily Wage Worker</option>
                  </select>
                </div>
              </div>

              {/* ID Checkboxes */}
              <div className="pt-2">
                <label className="text-[11px] font-semibold text-gray-600 block mb-2">Available Government IDs</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: "aadhaar", label: "Aadhaar" },
                    { key: "pan", label: "PAN" },
                    { key: "voter_id", label: "Voter ID" },
                    { key: "ration_card", label: "Ration Card" },
                    { key: "income_certificate", label: "Income Cert." },
                    { key: "caste_certificate", label: "Caste Cert." },
                    { key: "domicile_certificate", label: "Domicile Cert." },
                  ].map((doc) => (
                    <button
                      key={doc.key}
                      type="button"
                      onClick={() =>
                        setProfile({
                          ...profile,
                          gov_id_available: {
                            ...profile.gov_id_available,
                            [doc.key]: !(profile.gov_id_available as any)[doc.key],
                          },
                        })
                      }
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-all ${
                        (profile.gov_id_available as any)[doc.key]
                          ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                          : "bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      {(profile.gov_id_available as any)[doc.key] ? "✓ " : "+ "}
                      {doc.label}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={runAgentPipeline}
                disabled={running}
                className="w-full mt-4 h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-orange-500/25 transition-all active:scale-[0.98]"
              >
                {running ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <span>Executing AI Agents ({stepProgress}/4)...</span>
                  </span>
                ) : (
                  <span>⚡ Run Multi-Agent Pipeline Now</span>
                )}
              </Button>
            </div>
          </div>

          {/* Right Column: Execution Progress & Live Results */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step-by-step Progress Bar */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
              <h2 className="text-base font-bold text-[#1E1B4B] font-display mb-4 flex items-center justify-between">
                <span>2. Live Pipeline Execution State</span>
                {running && <span className="text-xs font-mono text-orange-600 animate-pulse">Running pipeline...</span>}
              </h2>

              <div className="grid grid-cols-4 gap-2 relative">
                {[
                  { step: 1, name: "Intake Agent", desc: "Normalization" },
                  { step: 2, name: "Eligibility Agent", desc: "Rule Matcher" },
                  { step: 3, name: "Ranking Agent", desc: "Prioritization" },
                  { step: 4, name: "DocGap Agent", desc: "Gap Check" },
                ].map((s) => {
                  const isDone = stepProgress >= s.step && !running;
                  const isActive = stepProgress === s.step && running;
                  const isPending = stepProgress < s.step;

                  return (
                    <div
                      key={s.step}
                      className={`p-3 rounded-2xl border text-center transition-all ${
                        isDone
                          ? "bg-emerald-50/70 border-emerald-200 text-emerald-800"
                          : isActive
                          ? "bg-orange-50 border-orange-400 text-orange-800 shadow-sm animate-pulse"
                          : "bg-gray-50 border-gray-100 text-gray-400"
                      }`}
                    >
                      <div className="text-xs font-bold flex items-center justify-center gap-1">
                        {isDone ? "✅" : isActive ? "⏳" : `Step ${s.step}`}
                      </div>
                      <div className="font-extrabold text-xs mt-1 truncate">{s.name}</div>
                      <div className="text-[10px] opacity-75 truncate">{s.desc}</div>
                    </div>
                  );
                })}
              </div>

              {errorMsg && (
                <div className="mt-4 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs leading-relaxed flex items-start gap-2.5">
                  <span className="text-base">⚠️</span>
                  <div>
                    <span className="font-bold block">Pipeline Execution Error:</span>
                    <span>{errorMsg}</span>
                  </div>
                </div>
              )}

              {/* Result Tabs & Display */}
              {result && (
                <div className="mt-6 pt-6 border-t border-gray-100 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex bg-gray-100/80 p-1 rounded-xl">
                      <button
                        onClick={() => setActiveTab("schemes")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          activeTab === "schemes" ? "bg-white text-[#1E1B4B] shadow-sm" : "text-gray-500 hover:text-gray-800"
                        }`}
                      >
                        🎯 Matched Schemes ({result.total_eligible_count ?? result.eligible_schemes?.length ?? 0})
                      </button>
                      <button
                        onClick={() => setActiveTab("docgap")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          activeTab === "docgap" ? "bg-white text-[#1E1B4B] shadow-sm" : "text-gray-500 hover:text-gray-800"
                        }`}
                      >
                        📋 DocGap Analysis
                      </button>
                      <button
                        onClick={() => setActiveTab("normalized")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          activeTab === "normalized" ? "bg-white text-[#1E1B4B] shadow-sm" : "text-gray-500 hover:text-gray-800"
                        }`}
                      >
                        ⚙️ Intake Output
                      </button>
                      <button
                        onClick={() => setActiveTab("raw")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          activeTab === "raw" ? "bg-white text-[#1E1B4B] shadow-sm" : "text-gray-500 hover:text-gray-800"
                        }`}
                      >
                        🔍 Raw JSON
                      </button>
                    </div>

                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      Processing: {result.processing_status?.toUpperCase() ?? "SUCCESS"}
                    </span>
                  </div>

                  {/* Tab 1: Matched Schemes */}
                  {activeTab === "schemes" && (
                    <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                      {result.eligible_schemes && result.eligible_schemes.length > 0 ? (
                        result.eligible_schemes.map((scheme: any, idx: number) => (
                          <div key={idx} className="p-4 rounded-2xl border border-gray-200 bg-gray-50/40 hover:bg-white transition-all shadow-2xs">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <span className="text-[11px] font-bold text-orange-600 uppercase tracking-wide">
                                  Priority #{scheme.priority_rank ?? idx + 1} • {getCategoryInfo(scheme.scheme_category).label}
                                </span>
                                <h4 className="font-extrabold text-sm sm:text-base text-[#1E1B4B] mt-0.5">
                                  {scheme.scheme_name}
                                </h4>
                                <p className="text-xs text-gray-500 font-medium">{scheme.issuing_authority}</p>
                              </div>
                              <span className="shrink-0 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-xs">
                                Match: {Math.round((scheme.eligibility_match_score ?? 1) * 100)}%
                              </span>
                            </div>

                            <p className="mt-2.5 text-xs text-gray-600 leading-relaxed bg-white p-3 rounded-xl border border-gray-100">
                              {scheme.benefit_summary || "Financial support and welfare benefits as per scheme guidelines."}
                            </p>

                            <div className="mt-3 flex items-center justify-between text-xs">
                              <span className="font-bold text-emerald-700">
                                💰 Est. Benefit: {scheme.benefit_value_estimate || "High Impact Welfare"}
                              </span>
                              {scheme.application_url && (
                                <a
                                  href={scheme.application_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-orange-600 font-bold hover:underline flex items-center gap-1"
                                >
                                  <span>Apply Online ↗</span>
                                </a>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                          <p className="text-sm font-bold text-gray-600">No matching schemes for this specific profile combination.</p>
                          <p className="text-xs text-gray-400 mt-1">Try selecting the Rural Farmer or Student Scholar preset!</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 2: DocGap Analysis */}
                  {activeTab === "docgap" && (
                    <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                      {result.eligible_schemes && result.eligible_schemes.length > 0 ? (
                        result.eligible_schemes.map((scheme: any, idx: number) => {
                          const missingDocs = scheme.missing_documents || [];
                          return (
                            <div key={idx} className="p-4 rounded-2xl border border-gray-200 bg-white">
                              <h4 className="font-bold text-sm text-[#1E1B4B]">{scheme.scheme_name}</h4>
                              <div className="mt-2 space-y-1.5">
                                {missingDocs.length > 0 ? (
                                  missingDocs.map((doc: string, dIdx: number) => (
                                    <div key={dIdx} className="flex items-center gap-2 text-xs text-amber-800 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                                      <span>⚠️</span>
                                      <span className="font-semibold">Missing Document required:</span>
                                      <span className="font-mono underline">{doc}</span>
                                    </div>
                                  ))
                                ) : (
                                  <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                                    <span>✅</span>
                                    <span className="font-bold">All Required Documents Available! Ready to Apply immediately.</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-xs text-gray-400 text-center py-6">No scheme document checklists to display.</p>
                      )}
                    </div>
                  )}

                  {/* Tab 3: Intake Normalized Output */}
                  {activeTab === "normalized" && (
                    <div className="bg-slate-900 rounded-2xl p-4 text-xs font-mono text-emerald-400 overflow-x-auto max-h-[460px]">
                      <pre>{JSON.stringify(result.normalized_profile || profile, null, 2)}</pre>
                    </div>
                  )}

                  {/* Tab 4: Raw JSON Response */}
                  {activeTab === "raw" && (
                    <div className="bg-slate-900 rounded-2xl p-4 text-xs font-mono text-slate-300 overflow-x-auto max-h-[460px]">
                      <pre>{JSON.stringify(result, null, 2)}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
