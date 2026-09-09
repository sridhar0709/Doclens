"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { listDocuments, uploadDocument, confirmDocument, type UserDocument } from "@/lib/api";

// ─── All document types matching Backend/models/enums.py GOV_ID_KEYS ──────────
const DOCUMENT_TYPES = [
  {
    id: "aadhaar",
    label: "Aadhaar Card",
    hint: "12-digit Unique Identification Number",
    icon: "card",
    color: "blue",
  },
  {
    id: "income_certificate",
    label: "Income Certificate",
    hint: "Annual income below ₹1L / ₹3L / ₹8L",
    icon: "income",
    color: "green",
  },
  {
    id: "caste_certificate",
    label: "Caste Certificate",
    hint: "SC / ST / OBC / EWS category proof",
    icon: "caste",
    color: "purple",
  },
  {
    id: "ration_card",
    label: "Ration Card",
    hint: "BPL / APL / Antyodaya card",
    icon: "ration",
    color: "orange",
  },
  {
    id: "domicile_certificate",
    label: "Domicile Certificate",
    hint: "State residence / permanent address proof",
    icon: "domicile",
    color: "teal",
  },
  {
    id: "disability_certificate",
    label: "Disability Certificate",
    hint: "40%+ disability recognised by Govt.",
    icon: "disability",
    color: "red",
  },
  {
    id: "land_record",
    label: "Land Record / Khatian",
    hint: "Proof of agricultural land ownership",
    icon: "land",
    color: "amber",
  },
  {
    id: "bank_passbook",
    label: "Bank Passbook",
    hint: "Active savings / Jan Dhan account",
    icon: "bank",
    color: "indigo",
  },
  {
    id: "voter_id",
    label: "Voter ID Card",
    hint: "EPIC — Electors' Photo Identity Card",
    icon: "voter",
    color: "slate",
  },
  {
    id: "education_marksheet",
    label: "Education Marksheet",
    hint: "Board / university marksheet or certificate",
    icon: "education",
    color: "cyan",
  },
] as const;

type DocId = (typeof DOCUMENT_TYPES)[number]["id"];

// ─── SVG icon map ──────────────────────────────────────────────────────────────
function DocIcon({ type, className }: { type: string; className?: string }) {
  const cls = cn("h-5 w-5", className);
  switch (type) {
    case "card":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <path d="M2 10h20M6 15h4" />
        </svg>
      );
    case "income":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z" />
        </svg>
      );
    case "caste":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    case "ration":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M3 3h18v18H3V3zm0 6h18M9 21V9" />
        </svg>
      );
    case "domicile":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          <path d="M9 22V12h6v10" />
        </svg>
      );
    case "disability":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <circle cx="12" cy="4" r="2" />
          <path d="M10 8l-2 5 3 1v5m1-11l2 4h4m-9 4l-2 4" />
        </svg>
      );
    case "land":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M3 17l4-8 4 5 3-3 4 6H3z" />
          <path d="M3 21h18" />
        </svg>
      );
    case "bank":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M3 10l9-7 9 7" />
          <path d="M5 10v8h4v-5h6v5h4v-8" />
          <path d="M3 21h18" />
        </svg>
      );
    case "voter":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <rect x="3" y="6" width="18" height="13" rx="2" />
          <circle cx="9" cy="12" r="2" />
          <path d="M13 10h5m-5 4h3" />
        </svg>
      );
    case "education":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M12 3L2 8l10 5 10-5-10-5z" />
          <path d="M2 8v8c0 2 4.5 4 10 4s10-2 10-4V8" />
          <path d="M22 8v5" />
        </svg>
      );
    default:
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z" />
        </svg>
      );
  }
}

// colour chip per doc type
const COLOR_MAP: Record<string, { bg: string; text: string; border: string }> = {
  blue:   { bg: "bg-blue-50",   text: "text-blue-600",   border: "border-blue-200"   },
  green:  { bg: "bg-green-50",  text: "text-green-600",  border: "border-green-200"  },
  purple: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200" },
  orange: { bg: "bg-orange-50", text: "text-orange-500", border: "border-orange-200" },
  teal:   { bg: "bg-teal-50",   text: "text-teal-600",   border: "border-teal-200"   },
  red:    { bg: "bg-red-50",    text: "text-red-500",    border: "border-red-200"    },
  amber:  { bg: "bg-amber-50",  text: "text-amber-600",  border: "border-amber-200"  },
  indigo: { bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-200" },
  slate:  { bg: "bg-slate-100", text: "text-slate-600",  border: "border-slate-200"  },
  cyan:   { bg: "bg-cyan-50",   text: "text-cyan-600",   border: "border-cyan-200"   },
};

export default function DocumentsPage() {
  const { session } = useAuth();
  const [uploadedDocs, setUploadedDocs] = useState<UserDocument[]>([]);
  const [uploading, setUploading] = useState<DocId | null>(null);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const pageRef = useRef<HTMLDivElement>(null);

  const [reviewingDoc, setReviewingDoc] = useState<UserDocument | null>(null);
  const [confirmingValue, setConfirmingValue] = useState<string>("");
  const [busyConfirming, setBusyConfirming] = useState<boolean>(false);

  async function handleConfirm() {
    if (!reviewingDoc) return;
    const token = session?.access_token || "";
    if (!token) return;
    setBusyConfirming(true);
    try {
      let payload: any = {};
      if (reviewingDoc.doc_type === "income_certificate") {
        payload = { annual_income: parseFloat(confirmingValue) || 0 };
      } else if (reviewingDoc.doc_type === "caste_certificate") {
        payload = { social_category: confirmingValue.toLowerCase() };
      } else if (reviewingDoc.doc_type === "disability_certificate") {
        payload = { disability_status: confirmingValue.toLowerCase() };
      }
      await confirmDocument(token, reviewingDoc.id, payload);
      setReviewingDoc(null);
      await refreshDocs();
    } catch (err) {
      console.error("Confirmation failed:", err);
    } finally {
      setBusyConfirming(false);
    }
  }

  // ── Fetch uploaded docs from backend on load ────────────────────────────────
  const refreshDocs = useCallback(async () => {
    const token = session?.access_token || "";
    if (!token) { setLoadingDocs(false); return; }
    try {
      const docs = await listDocuments(token);
      setUploadedDocs(docs);
    } catch {
      setUploadedDocs([]);
    } finally {
      setLoadingDocs(false);
    }
  }, [session?.access_token]);

  useEffect(() => { refreshDocs(); }, [refreshDocs]);

  // ── Entrance animations ─────────────────────────────────────────────────────
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    (async () => {
      const gsap = (await import("gsap")).default;
      try {
        const ctx = gsap.context(() => {
          gsap.fromTo(".dc-hero", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out", clearProps: "all" });
          gsap.fromTo(".dc-card", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.04, delay: 0.15, ease: "power2.out", clearProps: "all" });
        }, pageRef);
        cleanup = () => ctx.revert();
      } catch { return; }
    })();
    return () => { cleanup?.(); };
  }, []);

  // ── Upload handler ──────────────────────────────────────────────────────────
  async function handleUpload(docId: DocId, file: File) {
    const token = session?.access_token || "";
    if (!token) return;
    setUploading(docId);
    try {
      await uploadDocument(token, file, docId);
      await refreshDocs();
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(null);
    }
  }

  const uploadedCount = uploadedDocs.length;
  const verifiedCount = uploadedDocs.filter((d) => d.verification_status === "verified").length;
  const completionPct = Math.round((uploadedCount / DOCUMENT_TYPES.length) * 100);

  return (
    <div ref={pageRef} className="flex min-h-screen flex-col">
      <main className="flex-1 bg-gradient-to-b from-white to-warm-paper">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">

          {/* ── Header ── */}
          <div className="dc-hero">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-navy sm:text-3xl">
              Document Vault
            </h1>
            <p className="mt-1 text-sm text-slate-blue">
              Upload once. We&apos;ll use these to verify eligibility and pre-fill your applications.
            </p>
          </div>

          {/* ── Stats bar ── */}
          <div className="dc-hero mt-6 grid grid-cols-3 gap-3">
            {[
              { label: "Uploaded",   value: String(uploadedCount), colorCls: "text-verified-teal" },
              { label: "Verified",   value: String(verifiedCount), colorCls: "text-signal-orange" },
              { label: "Completion", value: `${completionPct}%`,   colorCls: "text-ink-navy" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-ink-navy/10 bg-white p-4 text-center shadow-sm">
                <p className={`text-2xl font-bold font-display ${stat.colorCls}`}>{stat.value}</p>
                <p className="text-xs text-slate-blue-400 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* ── Progress bar ── */}
          <div className="dc-hero mt-4">
            <div className="h-1.5 w-full rounded-full bg-ink-navy/8 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-signal-orange to-verified-teal transition-all duration-700"
                style={{ width: `${completionPct}%` }}
              />
            </div>
            <p className="mt-1 text-right text-xs text-slate-blue-400">
              {uploadedCount} of {DOCUMENT_TYPES.length} document types uploaded
            </p>
          </div>

          {/* ── Document cards grid ── */}
          {loadingDocs ? (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {DOCUMENT_TYPES.map((dt) => (
                <div key={dt.id} className="dc-card rounded-xl border-2 border-dashed border-ink-navy/10 bg-white p-5 animate-pulse">
                  <div className="h-9 w-9 rounded-lg bg-slate-100" />
                  <div className="mt-3 h-3.5 w-28 rounded bg-slate-100" />
                  <div className="mt-1.5 h-2.5 w-36 rounded bg-slate-100" />
                  <div className="mt-3 h-8 w-full rounded-lg bg-slate-100" />
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {DOCUMENT_TYPES.map((dt) => {
                const existing = uploadedDocs.find((d) => d.doc_type === dt.id);
                const colors = COLOR_MAP[dt.color] ?? COLOR_MAP.slate;
                const isUploading = uploading === dt.id;

                return (
                  <div
                    key={dt.id}
                    className={cn(
                      "dc-card rounded-xl border-2 transition-all duration-200",
                      existing
                        ? `${colors.border} bg-white shadow-sm`
                        : "border-dashed border-ink-navy/15 bg-white hover:border-signal-orange/40 hover:bg-signal-orange/[0.02] hover:shadow-sm"
                    )}
                  >
                    <div className="p-5">
                      {/* Icon + status badge */}
                      <div className="flex items-center justify-between">
                        <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", existing ? `${colors.bg} ${colors.text}` : "bg-warm-paper text-slate-blue-400")}>
                          <DocIcon type={dt.icon} />
                        </div>

                        {existing?.verification_status === "verified" && (
                          <span className="flex items-center gap-1 rounded-full bg-verified-teal/10 px-2 py-0.5 text-xs font-semibold text-verified-teal">
                            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M5 13l4 4L19 7" /></svg>
                            Verified
                          </span>
                        )}
                        {existing?.verification_status === "pending" && (
                          <span className="flex items-center gap-1 rounded-full bg-caution-amber/10 px-2 py-0.5 text-xs font-semibold text-caution-amber">
                            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
                            Pending
                          </span>
                        )}
                        {existing?.verification_status === "rejected" && (
                          <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-500">
                            Failed
                          </span>
                        )}
                      </div>

                      {/* Title & hint */}
                      <p className="mt-3 text-sm font-semibold text-ink-navy">{dt.label}</p>
                      <p className="mt-0.5 text-xs text-slate-blue-400 leading-relaxed">{dt.hint}</p>

                      {/* Upload date or Upload button */}
                      {existing ? (
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-xs text-slate-blue-400">
                            {existing.uploaded_at
                              ? `Uploaded ${new Date(existing.uploaded_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
                              : "Uploaded"}
                          </span>
                          <div className="flex items-center gap-3">
                            {existing.verification_status === "pending" && (
                              <button
                                onClick={() => {
                                  setReviewingDoc(existing);
                                  if (existing.doc_type === "income_certificate") {
                                    setConfirmingValue(existing.extracted_data?.annual_income?.toString() || "");
                                  } else if (existing.doc_type === "caste_certificate") {
                                    setConfirmingValue(existing.extracted_data?.social_category || "general");
                                  } else if (existing.doc_type === "disability_certificate") {
                                    setConfirmingValue(existing.extracted_data?.disability_status || "none");
                                  } else {
                                    setConfirmingValue("");
                                  }
                                }}
                                className="text-xs font-semibold text-verified-teal hover:underline"
                              >
                                Verify Details
                              </button>
                            )}
                            <label className="cursor-pointer text-xs font-medium text-signal-orange hover:underline">
                              Re-upload
                              <input
                                type="file"
                                className="hidden"
                                accept="image/*,.pdf"
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f) handleUpload(dt.id, f);
                                  e.target.value = "";
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      ) : (
                        <label
                          className={cn(
                            "mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-ink-navy/10 bg-warm-paper/50 px-3 py-2 text-xs font-medium text-slate-blue transition-colors",
                            isUploading
                              ? "opacity-60 cursor-not-allowed"
                              : "hover:border-signal-orange/30 hover:text-signal-orange"
                          )}
                        >
                          {isUploading ? (
                            <>
                              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" strokeOpacity={0.3}/><path d="M12 2a10 10 0 0110 10" /></svg>
                              Uploading…
                            </>
                          ) : (
                            <>
                              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 4v16m8-8H4" /></svg>
                              Upload
                            </>
                          )}
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*,.pdf"
                            disabled={isUploading}
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleUpload(dt.id, f);
                              e.target.value = "";
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Uploaded docs list ── */}
          {uploadedDocs.length > 0 && (
            <div className="mt-10">
              <h2 className="font-display text-lg font-semibold text-ink-navy">All uploaded documents</h2>
              <div className="mt-3 space-y-2">
                {uploadedDocs.map((doc) => {
                  const meta = DOCUMENT_TYPES.find((d) => d.id === doc.doc_type);
                  const colors = meta ? (COLOR_MAP[meta.color] ?? COLOR_MAP.slate) : COLOR_MAP.slate;
                  return (
                    <div key={doc.id} className="flex items-center justify-between rounded-xl border border-ink-navy/10 bg-white px-4 py-3 hover:shadow-sm transition-all">
                      <div className="flex items-center gap-3">
                        <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", colors.bg, colors.text)}>
                          <DocIcon type={meta?.icon ?? "card"} className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-ink-navy">{meta?.label ?? doc.doc_type}</p>
                          <p className="text-xs text-slate-blue-400">
                            {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""}
                          </p>
                        </div>
                      </div>
                      <span className={cn("text-xs font-semibold", doc.verification_status === "verified" ? "text-verified-teal" : doc.verification_status === "rejected" ? "text-red-500" : "text-caution-amber")}>
                        {doc.verification_status === "verified" ? "✓ Verified" : doc.verification_status === "rejected" ? "Failed" : "Pending"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Review & Confirm Modal ── */}
          {reviewingDoc && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-navy/40 backdrop-blur-sm p-4">
              <div className="w-full max-w-md rounded-2xl border border-ink-navy/10 bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-semibold text-ink-navy">
                    Confirm Document Details
                  </h3>
                  <button
                    onClick={() => setReviewingDoc(null)}
                    className="rounded-lg p-1.5 text-slate-blue-400 hover:bg-ink-navy/5 hover:text-ink-navy transition-colors"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="mt-4 space-y-4">
                  <p className="text-sm text-slate-blue">
                    Please verify the details extracted from your{" "}
                    <span className="font-semibold text-ink-navy">
                      {DOCUMENT_TYPES.find((d) => d.id === reviewingDoc.doc_type)?.label || reviewingDoc.doc_type}
                    </span>
                    .
                  </p>

                  {/* If income certificate */}
                  {reviewingDoc.doc_type === "income_certificate" && (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-700">
                        Annual household income (₹)
                      </label>
                      <input
                        type="number"
                        className="block w-full rounded-lg border-2 border-ink-navy/15 bg-white px-3.5 py-2.5 text-sm text-ink-navy focus:border-signal-orange focus:outline-none"
                        value={confirmingValue}
                        onChange={(e) => setConfirmingValue(e.target.value)}
                        placeholder="e.g. 150000"
                      />
                    </div>
                  )}

                  {/* If caste certificate */}
                  {reviewingDoc.doc_type === "caste_certificate" && (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-700">
                        Social category
                      </label>
                      <select
                        className="block w-full rounded-lg border-2 border-ink-navy/15 bg-white px-3.5 py-2.5 text-sm text-ink-navy focus:border-signal-orange focus:outline-none"
                        value={confirmingValue}
                        onChange={(e) => setConfirmingValue(e.target.value)}
                      >
                        <option value="general">General</option>
                        <option value="obc">OBC</option>
                        <option value="sc">SC</option>
                        <option value="st">ST</option>
                        <option value="ews">EWS</option>
                      </select>
                    </div>
                  )}

                  {/* If disability certificate */}
                  {reviewingDoc.doc_type === "disability_certificate" && (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-700">
                        Disability type
                      </label>
                      <select
                        className="block w-full rounded-lg border-2 border-ink-navy/15 bg-white px-3.5 py-2.5 text-sm text-ink-navy focus:border-signal-orange focus:outline-none"
                        value={confirmingValue}
                        onChange={(e) => setConfirmingValue(e.target.value)}
                      >
                        <option value="none">None</option>
                        <option value="locomotor">Locomotor disability</option>
                        <option value="visual">Visual impairment</option>
                        <option value="hearing">Hearing impairment</option>
                        <option value="mental">Intellectual/mental disability</option>
                        <option value="other">Other disability</option>
                      </select>
                    </div>
                  )}

                  {/* For general ID cards like Aadhaar */}
                  {!["income_certificate", "caste_certificate", "disability_certificate"].includes(reviewingDoc.doc_type) && (
                    <div className="rounded-lg bg-warm-paper/50 p-3 text-xs text-slate-blue border border-ink-navy/5">
                      ℹ️ DocLens has verified that the uploaded document's name and metadata match your profile details.
                    </div>
                  )}

                  {/* Display extracted OCR text */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-700">
                      Extracted Text (OCR Result)
                    </label>
                    {reviewingDoc.extracted_data?.raw_text ? (
                      <div className="max-h-40 overflow-y-auto rounded-lg border border-ink-navy/10 bg-warm-paper/30 p-3 text-xs font-mono text-slate-blue whitespace-pre-wrap leading-relaxed">
                        {reviewingDoc.extracted_data.raw_text}
                      </div>
                    ) : (
                      <div className="rounded-lg bg-caution-amber/10 p-3 text-xs text-caution-amber border border-caution-amber/20">
                        ⚠️ No text could be automatically extracted from this document. Please ensure the document is clear and readable.
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setReviewingDoc(null)}
                    disabled={busyConfirming}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleConfirm}
                    disabled={busyConfirming}
                    className="bg-signal-orange text-white hover:bg-signal-orange/90"
                  >
                    {busyConfirming ? (
                      <>
                        <svg className="mr-1.5 h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <circle cx="12" cy="12" r="10" strokeOpacity={0.3} />
                          <path d="M12 2a10 10 0 0110 10" />
                        </svg>
                        Verifying...
                      </>
                    ) : (
                      "Confirm & Verify"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
