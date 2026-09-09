import { cn } from "@/lib/utils";

interface DocumentItem {
  name: string;
  uploaded: boolean;
  required: boolean;
}

interface DocumentChecklistProps {
  documents: DocumentItem[];
  className?: string;
}

export function DocumentChecklist({ documents, className }: DocumentChecklistProps) {
  const missingCount = documents.filter((d) => !d.uploaded).length;

  return (
    <div className={cn("rounded-xl border border-ink-navy/10 bg-white p-5", className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-ink-navy">Documents</h3>
        {missingCount > 0 && (
          <span className="text-xs font-medium text-caution-amber">
            {missingCount} missing
          </span>
        )}
      </div>
      <div className="mt-3 space-y-2">
        {documents.map((doc) => (
          <div
            key={doc.name}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
              doc.uploaded
                ? "bg-verified-teal/5"
                : "bg-warm-paper/50"
            )}
          >
            <div
              className={cn(
                "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2",
                doc.uploaded
                  ? "border-verified-teal bg-verified-teal text-white"
                  : "border-ink-navy/20"
              )}
            >
              {doc.uploaded && (
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                  <path d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink-navy">{doc.name}</p>
              {doc.uploaded && (
                <p className="text-xs text-verified-teal">Uploaded & verified</p>
              )}
              {!doc.uploaded && doc.required && (
                <p className="text-xs text-caution-amber">Required — upload now</p>
              )}
            </div>
            {!doc.uploaded && (
              <button className="text-xs font-semibold text-signal-orange hover:text-signal-orange-600 transition-colors">
                Upload
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
