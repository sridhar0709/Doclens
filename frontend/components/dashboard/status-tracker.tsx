import { cn } from "@/lib/utils";

interface StatusTrackerProps {
  currentStatus: "matched" | "applied" | "approved";
  className?: string;
}

const steps = [
  { key: "matched", label: "Matched" },
  { key: "applied", label: "Applied" },
  { key: "approved", label: "Approved" },
] as const;

export function StatusTracker({ currentStatus, className }: StatusTrackerProps) {
  const currentIdx = steps.findIndex((s) => s.key === currentStatus);

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {steps.map((step, idx) => (
        <div key={step.key} className="flex items-center">
          {idx > 0 && (
            <div
              className={cn(
                "h-0.5 w-6 sm:w-10",
                idx <= currentIdx ? "bg-verified-teal" : "bg-ink-navy/10"
              )}
            />
          )}
          <div className="flex items-center gap-1.5">
            <div
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-mono font-bold",
                idx < currentIdx
                  ? "bg-verified-teal text-white"
                  : idx === currentIdx
                  ? "bg-verified-teal text-white ring-2 ring-verified-teal/30"
                  : "bg-ink-navy/10 text-slate-blue-400"
              )}
            >
              {idx < currentIdx ? (
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                  <path d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                idx + 1
              )}
            </div>
            <span
              className={cn(
                "hidden text-xs font-medium sm:inline",
                idx <= currentIdx ? "text-ink-navy" : "text-slate-blue-400"
              )}
            >
              {step.label}
            </span>
          </div>
        </div>
      ))}
      <span className="ml-1 text-xs text-slate-blue-400 sm:hidden">
        {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
      </span>
    </div>
  );
}
