"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { listNotifications, markNotificationRead, type Notification } from "@/lib/api";

const typeConfig: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  new_match: {
    icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>,
    color: "text-verified-teal",
    bg: "bg-verified-teal/10",
  },
  doc_missing_reminder: {
    icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>,
    color: "text-caution-amber",
    bg: "bg-caution-amber/10",
  },
  scheme_updated: {
    icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>,
    color: "text-slate-blue-400",
    bg: "bg-ink-navy/5",
  },
};

const typeLabels: Record<string, string> = {
  new_match: "Scheme Match",
  doc_missing_reminder: "Reminder",
  scheme_updated: "Update",
};

const tabs = ["All", "Unread"];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function NotificationsPage() {
  const { session } = useAuth();
  const [tab, setTab] = useState("All");
  const [data, setData] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!session?.access_token) return;
    listNotifications(session.access_token)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session?.access_token]);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    (async () => {
      const gsap = (await import("gsap")).default;
      try {
        const ntEls = pageRef.current?.querySelectorAll(".nt-hero, .nt-tabs, .nt-item");
        if (ntEls?.length) gsap.killTweensOf(ntEls);
        const ctx = gsap.context(() => {
          gsap.fromTo(".nt-hero", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out", clearProps: "all" });
          gsap.fromTo(".nt-tabs", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.3, delay: 0.1, ease: "power2.out", clearProps: "all" });
          gsap.fromTo(".nt-item", { opacity: 0, x: -8 }, { opacity: 1, x: 0, duration: 0.3, stagger: 0.04, delay: 0.2, ease: "power2.out", clearProps: "all" });
        }, pageRef);
        cleanup = () => ctx.revert();
      } catch { return; }
    })();
    return () => { cleanup?.(); };
  }, [data]);

  const filtered = data.filter((n) => tab !== "Unread" || !n.read_at);
  const unreadCount = data.filter((n) => !n.read_at).length;

  async function markAllRead() {
    if (!session?.access_token) return;
    for (const n of data) {
      if (!n.read_at) await markNotificationRead(session.access_token, n.id);
    }
    setData((prev) => prev.map((n) => ({ ...n, read_at: new Date().toISOString() })));
  }

  const toggleRead = useCallback(async (id: string) => {
    if (!session?.access_token) return;
    const n = data.find((d) => d.id === id);
    if (n && !n.read_at) {
      await markNotificationRead(session.access_token, id);
    }
    setData((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, read_at: d.read_at ? null : new Date().toISOString() } : d
      )
    );
  }, [session?.access_token]);

  return (
    <div ref={pageRef} className="flex min-h-screen flex-col">
      <main className="flex-1 bg-gradient-to-b from-white to-warm-paper">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="nt-hero flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-navy sm:text-3xl">Notifications</h1>
              <p className="mt-1 text-sm text-slate-blue">
                {loading
                  ? "Loading…"
                  : unreadCount > 0
                    ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                    : "No unread notifications"}
              </p>
            </div>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-sm font-semibold text-signal-orange hover:text-signal-orange-600 transition-colors">
                Mark all as read
              </button>
            )}
          </div>

          <div className="nt-tabs mt-6 flex gap-1 overflow-x-auto rounded-lg bg-ink-navy/5 p-1">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-all",
                  tab === t ? "bg-white text-ink-navy shadow-sm" : "text-slate-blue hover:text-ink-navy"
                )}
              >
                {t}
                {t === "Unread" && unreadCount > 0 && (
                  <span className="ml-2 rounded-full bg-signal-orange/10 px-1.5 py-0.5 text-xs font-medium text-signal-orange">{unreadCount}</span>
                )}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="mt-12 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-navy/10 border-t-signal-orange mx-auto" />
            </div>
          ) : filtered.length > 0 ? (
            <div className="nt-list mt-5 space-y-2">
              {filtered.map((n) => {
                const cfg = typeConfig[n.type] || typeConfig.scheme_updated;
                const payload = n.payload as Record<string, string> | undefined;
                return (
                  <div
                    key={n.id}
                    className={cn(
                      "nt-item flex items-start gap-4 rounded-xl border p-4 transition-all cursor-pointer",
                      n.read_at
                        ? "border-ink-navy/10 bg-white hover:shadow-sm"
                        : "border-signal-orange/15 bg-gradient-to-r from-signal-orange/[0.02] to-white hover:shadow-sm"
                    )}
                    onClick={() => toggleRead(n.id)}
                  >
                    <div className={cn("flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg", cfg.bg, cfg.color)}>
                      {cfg.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className={cn("inline-block rounded-md px-2 py-0.5 text-[10px] font-medium", cfg.bg, cfg.color)}>
                            {typeLabels[n.type] || n.type}
                          </span>
                          <h3 className={cn("mt-1 text-sm font-semibold", n.read_at ? "text-ink-navy" : "text-ink-navy")}>
                            {payload?.title || "Notification"}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!n.read_at && <span className="h-2 w-2 rounded-full bg-signal-orange" />}
                          <span className="text-xs text-slate-blue-400">{timeAgo(n.created_at)}</span>
                        </div>
                      </div>
                      <p className="mt-1 text-sm text-slate-blue leading-relaxed">{payload?.message || ""}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="nt-list mt-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-navy/5">
                <svg className="h-7 w-7 text-slate-blue-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" />
                </svg>
              </div>
              <p className="mt-4 text-sm font-medium text-ink-navy">No notifications</p>
              <p className="text-sm text-slate-blue-400">Nothing here for this filter yet.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
