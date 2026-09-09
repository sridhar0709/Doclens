import { Button } from "@/components/ui/button";
import { ConfidenceBadge } from "@/components/ui/confidence-badge";
import Link from "next/link";

const schemeData = {
  name: "PM-KISAN",
  confidence: 0.92,
  description: "Pradhan Mantri Kisan Samman Nidhi — income support of ₹6,000 per year for small and marginal farmers.",
  category: "Agriculture",
  ministry: "Ministry of Agriculture & Farmers Welfare",
  benefit: "₹6,000 per year, paid in three instalments of ₹2,000 each.",
  eligibility: [
    { label: "Age", met: true, detail: "18 years or older" },
    { label: "Income", met: true, detail: "Annual income below ₹3,00,000" },
    { label: "Occupation", met: true, detail: "Small or marginal farmer (landholding ≤ 2 ha)" },
    { label: "Residence", met: true, detail: "Indian citizen" },
    { label: "Land documents", met: false, detail: "Land ownership papers required" },
  ],
  documents: [
    { name: "Aadhaar Card", status: "uploaded" as const },
    { name: "Land Ownership Certificate", status: "missing" as const },
    { name: "Bank Account Details", status: "missing" as const },
  ],
  steps: [
    "Upload missing documents",
    "Review pre-filled application",
    "Download and sign the form",
    "Submit at nearest Common Service Centre",
  ],
};

export default function SchemeDetailPage() {
  const s = schemeData;

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 bg-ink-navy/3">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
          {/* Breadcrumb */}
          <nav className="mb-6 text-sm text-slate-blue-400">
            <Link href="/schemes" className="hover:text-ink-navy transition-colors">Schemes</Link>
            <span className="mx-2">/</span>
            <span className="text-ink-navy">{s.name}</span>
          </nav>

          {/* Header section */}
          <div className="rounded-2xl border border-ink-navy/10 bg-white p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="rounded-md bg-signal-orange/10 px-2.5 py-0.5 text-xs font-medium text-signal-orange">
                    {s.category}
                  </span>
                  <span className="text-xs text-slate-blue-400">Central Government</span>
                </div>
                <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink-navy">
                  {s.name}
                </h1>
                <p className="mt-2 text-base leading-relaxed text-slate-blue">{s.description}</p>
              </div>
              <ConfidenceBadge score={s.confidence} size="lg" />
            </div>

            <div className="mt-6 rounded-lg bg-warm-paper/50 p-4 border border-ink-navy/8">
              <p className="text-sm text-slate-blue-400">Administered by</p>
              <p className="text-sm font-medium text-ink-navy">{s.ministry}</p>
            </div>
          </div>

          {/* Benefit */}
          <div className="mt-6 rounded-2xl border border-verified-teal/15 bg-verified-teal/5 p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-verified-teal/10 text-verified-teal">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-verified-teal">You qualify for this benefit</p>
                <p className="mt-1 text-lg font-display font-semibold text-ink-navy">{s.benefit}</p>
              </div>
            </div>
          </div>

          {/* Two columns */}
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {/* Eligibility breakdown */}
            <div className="rounded-xl border border-ink-navy/10 bg-white p-5">
              <h2 className="font-display text-lg font-semibold text-ink-navy">Your eligibility</h2>
              <div className="mt-4 space-y-3">
                {s.eligibility.map((e) => (
                  <div key={e.label} className="flex items-start gap-3">
                    <div className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${
                      e.met ? "bg-verified-teal/10 text-verified-teal" : "bg-caution-amber/10 text-caution-amber"
                    }`}>
                      {e.met ? (
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                          <path d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink-navy">{e.label}</p>
                      <p className="text-xs text-slate-blue-400">{e.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Documents needed */}
            <div className="rounded-xl border border-ink-navy/10 bg-white p-5">
              <h2 className="font-display text-lg font-semibold text-ink-navy">Documents needed</h2>
              <div className="mt-4 space-y-2">
                {s.documents.map((d) => (
                  <div
                    key={d.name}
                    className={`flex items-center justify-between rounded-lg px-3 py-2.5 ${
                      d.status === "uploaded" ? "bg-verified-teal/5" : "bg-warm-paper/50"
                    }`}
                  >
                    <span className="text-sm text-ink-navy">{d.name}</span>
                    {d.status === "uploaded" ? (
                      <span className="flex items-center gap-1 text-xs font-medium text-verified-teal">
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                        Uploaded
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-caution-amber">Missing</span>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Button href="/documents" size="sm">
                  Upload documents
                </Button>
              </div>
            </div>
          </div>

          {/* How to apply */}
          <div className="mt-6 rounded-xl border border-ink-navy/10 bg-white p-5">
            <h2 className="font-display text-lg font-semibold text-ink-navy">How to apply</h2>
            <div className="mt-4 space-y-0">
              {s.steps.map((step, i) => (
                <div key={i} className="flex items-start gap-3 pb-4 last:pb-0">
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-ink-navy text-xs font-semibold text-white">
                    {i + 1}
                  </div>
                  <p className="pt-0.5 text-sm text-slate-blue">{step}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 flex gap-3">
              <Button>View draft application</Button>
              <Button variant="outline">Download checklist</Button>
            </div>
          </div>

          {/* Request ID & disclaimer */}
          <div className="mt-8 space-y-3">
            <div className="flex items-center gap-2 text-xs text-slate-blue-400">
              <span className="font-mono">req_8f3a2c7b</span>
              <span className="h-1 w-1 rounded-full bg-slate-blue-300" />
              <span>Deterministic match • v1.0</span>
            </div>
            <div className="rounded-lg border border-caution-amber/15 bg-caution-amber/5 px-4 py-2.5">
              <p className="text-xs text-caution-amber-600">
                <strong>Independent project:</strong> DocLens is an open-source project — not an official government service.
                Verify this scheme&apos;s eligibility criteria with the relevant ministry before applying.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
