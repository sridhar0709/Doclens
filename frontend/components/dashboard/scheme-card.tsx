import { ConfidenceBadge } from "@/components/ui/confidence-badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SchemeCardProps {
  name: string;
  description: string;
  confidence: number;
  missingDocs: number;
  status?: "matched" | "applied" | "approved";
}

const statusLabels = {
  matched: "Eligible",
  applied: "Applied",
  approved: "Approved",
};

const statusStyles = {
  matched: "bg-verified-teal/10 text-verified-teal border-verified-teal/20",
  applied: "bg-caution-amber/10 text-caution-amber border-caution-amber/20",
  approved: "bg-verified-teal/10 text-verified-teal border-verified-teal/20",
};

export function SchemeCard({
  name,
  description,
  confidence,
  missingDocs,
  status = "matched",
}: SchemeCardProps) {
  return (
    <div className="group rounded-xl border border-ink-navy/10 bg-white p-5 transition-all hover:border-ink-navy/20 hover:shadow-sm">
      <div className="flex items-start gap-4">
        <ConfidenceBadge score={confidence} size="md" showLabel={false} className="mt-0.5" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="font-display text-lg font-semibold text-ink-navy">{name}</h3>
              <p className="mt-0.5 text-sm text-slate-blue">{description}</p>
            </div>
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                statusStyles[status]
              )}
            >
              {statusLabels[status]}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-blue-400">
            <span className="flex items-center gap-1">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {missingDocs > 0
                ? `${missingDocs} document${missingDocs > 1 ? "s" : ""} needed`
                : "All documents ready"}
            </span>
            <span className="flex items-center gap-1">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              {confidence >= 0.8
                ? "Apply now"
                : confidence >= 0.5
                ? "Verify details"
                : "Review requirements"}
            </span>
          </div>

          <div className="mt-4 flex gap-2">
            {status === "matched" && (
              <Button size="sm" href={`/scheme-details/${name.toLowerCase().replace(/\s+/g, "-")}`}>
                {missingDocs > 0 ? "Upload & apply" : "Apply now"}
              </Button>
            )}
            {status === "applied" && (
              <Button size="sm" variant="secondary" href={`/scheme-details/${name.toLowerCase().replace(/\s+/g, "-")}`}>
                Track status
              </Button>
            )}
            {status === "approved" && (
              <Button size="sm" variant="outline" href={`/scheme-details/${name.toLowerCase().replace(/\s+/g, "-")}`}>
                View details
              </Button>
            )}
            <Button size="sm" variant="ghost" href={`/scheme-details/${name.toLowerCase().replace(/\s+/g, "-")}`}>
              Details
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
