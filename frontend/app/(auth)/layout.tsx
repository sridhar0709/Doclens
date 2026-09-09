import Link from "next/link";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-warm-paper">
      <Link
        href="/"
        className="fixed left-4 top-4 z-40 flex items-center gap-2.5 rounded-lg bg-white/85 px-3 py-2 shadow-sm ring-1 ring-ink-navy/10 backdrop-blur sm:left-6 sm:top-6"
        aria-label="DocLens home"
      >
        <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg">
          <img
            src="/assets/logo-bg.png"
            alt=""
            className="h-full w-full object-contain"
            loading="lazy"
          />
        </span>
        <span className="font-display text-sm font-semibold tracking-tight text-ink-navy">
          DocLens
        </span>
      </Link>
      {children}
    </div>
  );
}
