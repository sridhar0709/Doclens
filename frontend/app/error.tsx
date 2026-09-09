"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-warm-paper px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-signal-orange/10">
          <svg className="h-7 w-7 text-signal-orange" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4m0 4h.01" />
          </svg>
        </div>
        <h1 className="mt-4 font-display text-xl font-semibold text-ink-navy">Something went wrong</h1>
        <p className="mt-2 text-sm text-slate-blue">An unexpected error occurred while loading this page.</p>
        <p className="mt-1 text-xs text-slate-blue-400 font-mono">{error.message}</p>
        <button
          onClick={reset}
          className="mt-6 rounded-lg bg-signal-orange px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-signal-orange-600 hover:shadow-md"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
