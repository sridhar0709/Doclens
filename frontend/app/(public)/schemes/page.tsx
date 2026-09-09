"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { fetchAllSchemes, type Scheme } from "@/lib/api";
import { CATEGORY_LIST, getCategoryInfo, normalizeCategoryKey } from "@/lib/categories";

const PAGE_SIZE = 60;

function SchemeCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-100 bg-white p-5 shadow-sm border-l-4 border-l-slate-200">
      <div className="flex items-start justify-between mb-3">
        <div className="h-5 w-20 rounded-full bg-slate-100" />
        <div className="h-4 w-28 rounded bg-slate-100" />
      </div>
      <div className="h-5 w-4/5 rounded bg-slate-100 mb-2" />
      <div className="h-4 w-full rounded bg-slate-100 mb-1" />
      <div className="h-4 w-3/4 rounded bg-slate-100 mb-3" />
      <div className="h-4 w-24 rounded bg-slate-100" />
    </div>
  );
}

export default function SchemesPage() {
  const [allSchemes, setAllSchemes] = useState<Scheme[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load ALL schemes once on mount (paginated behind the scenes)
  useEffect(() => {
    setLoading(true);
    fetchAllSchemes()
      .then(({ schemes, total }) => {
        setAllSchemes(schemes);
        setTotal(total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Debounce search input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  // Reset page when category changes
  useEffect(() => { setPage(1); }, [category]);

  // Client-side filtering
  const filtered = useMemo(() => {
    const q = debouncedSearch.toLowerCase().trim();
    return allSchemes.filter((s) => {
      const matchCat = category === "all" || normalizeCategoryKey(s.scheme_category) === category;
      const matchSearch = !q ||
        s.scheme_name.toLowerCase().includes(q) ||
        s.benefit_summary.toLowerCase().includes(q) ||
        s.issuing_authority.toLowerCase().includes(q) ||
        s.scheme_category.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [allSchemes, debouncedSearch, category]);

  const visible = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = visible.length < filtered.length;

  const loadMore = useCallback(() => setPage((p) => p + 1), []);

  // Derive live category counts from filtered-by-search results
  const catCounts = useMemo(() => {
    const q = debouncedSearch.toLowerCase().trim();
    const base = q
      ? allSchemes.filter((s) =>
          s.scheme_name.toLowerCase().includes(q) ||
          s.benefit_summary.toLowerCase().includes(q) ||
          s.issuing_authority.toLowerCase().includes(q) ||
          s.scheme_category.toLowerCase().includes(q)
        )
      : allSchemes;
    const map: Record<string, number> = {};
    base.forEach((s) => {
      const key = normalizeCategoryKey(s.scheme_category);
      map[key] = (map[key] ?? 0) + 1;
    });
    return map;
  }, [allSchemes, debouncedSearch]);

  const displayTotal = total || allSchemes.length;

  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  const checkScrollLimits = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 5);
    setShowRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    checkScrollLimits();

    el.addEventListener("scroll", checkScrollLimits);
    window.addEventListener("resize", checkScrollLimits);

    const timer = setTimeout(checkScrollLimits, 300);

    return () => {
      el.removeEventListener("scroll", checkScrollLimits);
      window.removeEventListener("resize", checkScrollLimits);
      clearTimeout(timer);
    };
  }, [allSchemes, filtered, checkScrollLimits]);

  const scrollByAmount = (amount: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F6FC]">
      {/* ── Hero Header ──────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#1E1B4B] via-[#4C1D95] to-[#4338CA]">
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-orange-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 bottom-0 h-56 w-56 rounded-full bg-teal-400/10 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-orange-300 backdrop-blur mb-4">
              🏛️ Government Scheme Database
            </span>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Browse All Schemes
            </h1>
            <p className="mt-3 text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
              {loading
                ? "Loading scheme database…"
                : `Explore ${displayTotal.toLocaleString()}+ government welfare schemes across India`}
            </p>
          </div>

          {/* ── Search bar ── */}
          <div className="mt-8 mx-auto max-w-2xl">
            <div className="relative group">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none transition-colors group-focus-within:text-orange-400"
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
              >
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, category, state, or ministry…"
                className="w-full rounded-2xl border-2 border-white/20 bg-white/10 py-4 pl-12 pr-12 text-sm text-white placeholder:text-slate-400 backdrop-blur focus:border-orange-400 focus:bg-white/15 focus:outline-none transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              )}
            </div>
          </div>

          {/* ── Stats bar ── */}
          {!loading && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-teal-400" />
                {displayTotal.toLocaleString()} Total Schemes
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-orange-400" />
                {filtered.length.toLocaleString()} Matching
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-purple-400" />
                {Object.keys(catCounts).length} Categories
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Category filter strip ──────────────────────────────────────── */}
      <div className="sticky top-[64px] z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 relative">
          
          {/* Left scroll arrow */}
          {showLeft && (
            <button
              onClick={() => scrollByAmount(-240)}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white/90 shadow-md backdrop-blur hover:bg-white transition-all text-[#1E1B4B] hover:scale-105 active:scale-95"
              aria-label="Scroll left"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M15 19l-7-7 7-7"/></svg>
            </button>
          )}

          <div
            ref={scrollRef}
            className="flex items-center gap-2 overflow-x-auto py-3.5 scrollbar-none select-none scroll-smooth"
          >
            {CATEGORY_LIST.map((cat) => {
              const count = cat.key === "all" ? filtered.length : (catCounts[cat.key] ?? 0);
              const isActive = category === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => setCategory(cat.key)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all whitespace-nowrap",
                    isActive
                      ? cat.key === "all"
                        ? "border-[#1E1B4B] bg-[#1E1B4B] text-white shadow-md"
                        : `${cat.badge} border-transparent shadow-md ring-1 ring-current/30`
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                  {count > 0 && (
                    <span className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                      isActive ? "bg-black/15" : "bg-slate-100 text-slate-500"
                    )}>
                      {count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right scroll arrow */}
          {showRight && (
            <button
              onClick={() => scrollByAmount(240)}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white/90 shadow-md backdrop-blur hover:bg-white transition-all text-[#1E1B4B] hover:scale-105 active:scale-95"
              aria-label="Scroll right"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M9 5l7 7-7 7"/></svg>
            </button>
          )}

        </div>
      </div>

      {/* ── Main content ───────────────────────────────────────────────── */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Result count row */}
        {!loading && (
          <div className="mb-5 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-600">
              Showing <span className="text-[#1E1B4B]">{visible.length.toLocaleString()}</span>
              {" "}of{" "}
              <span className="text-[#1E1B4B]">{filtered.length.toLocaleString()}</span> schemes
              {debouncedSearch && <span className="text-slate-400"> for "<span className="italic">{debouncedSearch}</span>"</span>}
            </p>
            {(debouncedSearch || category !== "all") && (
              <button
                onClick={() => { setSearch(""); setCategory("all"); }}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M6 18L18 6M6 6l12 12"/></svg>
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Loading skeleton */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 18 }).map((_, i) => <SchemeCardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              <svg className="h-7 w-7 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            </div>
            <p className="text-lg font-bold text-slate-700">No schemes found</p>
            <p className="mt-1 text-sm text-slate-400 max-w-sm mx-auto">
              Try adjusting your search terms or selecting a different category.
            </p>
            <button
              onClick={() => { setSearch(""); setCategory("all"); }}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((s) => {
                const cs = getCategoryInfo(s.scheme_category);
                return (
                  <Link
                    key={s.scheme_id}
                    href={`/schemes/${s.scheme_id}`}
                    className={cn(
                      "group flex flex-col rounded-2xl border border-slate-100 border-l-4 bg-white p-5 shadow-sm transition-all duration-200",
                      "hover:shadow-lg hover:-translate-y-0.5 hover:border-slate-200",
                      cs.border, cs.glow
                    )}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold", cs.badge)}>
                        <span>{cs.icon}</span>
                        <span>{cs.label}</span>
                      </span>
                      {s.benefit_value_estimate && (
                        <span className="shrink-0 text-[11px] font-bold text-teal-600 bg-teal-50 rounded-full px-2 py-0.5 border border-teal-200">
                          {s.benefit_value_estimate.length > 18 ? s.benefit_value_estimate.slice(0, 18) + "…" : s.benefit_value_estimate}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-bold leading-snug text-[#1E1B4B] group-hover:text-orange-600 transition-colors line-clamp-2 mb-1.5">
                      {s.scheme_name}
                    </h3>

                    {/* Summary */}
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 flex-1 mb-3">
                      {s.benefit_summary}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <p className="text-[11px] text-slate-400 truncate max-w-[75%]">{s.issuing_authority}</p>
                      <svg className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-orange-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M9 18l6-6-6-6"/>
                      </svg>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Load more */}
            {hasMore && (
              <div className="mt-10 text-center">
                <p className="text-sm text-slate-500 mb-4">
                  Showing {visible.length.toLocaleString()} of {filtered.length.toLocaleString()} schemes
                </p>
                <button
                  onClick={loadMore}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#1E1B4B] to-[#4338CA] px-8 py-3.5 text-sm font-bold text-white hover:opacity-90 transition-all shadow-lg shadow-[#1E1B4B]/20 active:scale-95"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 5v14M5 12l7 7 7-7"/></svg>
                  Load {Math.min(PAGE_SIZE, filtered.length - visible.length).toLocaleString()} more schemes
                </button>
              </div>
            )}

            {!hasMore && filtered.length > PAGE_SIZE && (
              <p className="mt-8 text-center text-sm font-medium text-slate-400">
                ✅ All {filtered.length.toLocaleString()} matching schemes shown
              </p>
            )}
          </>
        )}
      </main>
    </div>
  );
}
