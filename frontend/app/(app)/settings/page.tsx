"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { API_URL } from "@/lib/api";

const tabs = ["Notifications", "Appearance", "Privacy", "Account"];

const SETTINGS_KEY = "doclens_settings";

type Settings = {
  emailNotifs: boolean;
  smsNotifs: boolean;
  pushNotifs: boolean;
  quietStart: number;
  quietEnd: number;
  darkMode: boolean;
  compactView: boolean;
  language: string;
  shareData: boolean;
  analytics: boolean;
};

const DEFAULT_SETTINGS: Settings = {
  emailNotifs: true,
  smsNotifs: false,
  pushNotifs: true,
  quietStart: 22,
  quietEnd: 8,
  darkMode: false,
  compactView: false,
  language: "en",
  shareData: true,
  analytics: false,
};

function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEFAULT_SETTINGS;
}

function saveSettings(s: Settings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

function Toggle({ enabled, onChange, label, desc }: { enabled: boolean; onChange: (v: boolean) => void; label: string; desc: string }) {
  return (
    <label className="flex items-center justify-between rounded-xl bg-warm-paper/50 px-5 py-4 transition-colors hover:bg-warm-paper/80">
      <div>
        <p className="text-sm font-medium text-ink-navy">{label}</p>
        <p className="text-xs text-slate-blue-400">{desc}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className={cn(
          "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
          enabled ? "bg-signal-orange" : "bg-ink-navy/15"
        )}
      >
        <span className={cn(
          "inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition-transform",
          enabled ? "translate-x-5" : "translate-x-0"
        )} />
      </button>
    </label>
  );
}

export default function SettingsPage() {
  const [tab, setTab] = useState(0);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [saved, setSaved] = useState(false);

  const { session, user, signOut } = useAuth();
  const [currentDevice, setCurrentDevice] = useState("Chrome on Windows");

  // ── Modal states ────────────────────────────────────────────────────
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [emailBusy, setEmailBusy] = useState(false);

  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // ── Load persisted settings ─────────────────────────────────────────
  useEffect(() => {
    setSettings(loadSettings());
    setSettingsLoaded(true);
  }, []);

  // ── Persist + apply side effects on change ──────────────────────────
  const updateSetting = useCallback(<K extends keyof Settings>(key: K, val: Settings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: val };
      saveSettings(next);
      return next;
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, []);

  // Apply dark mode to <html>
  useEffect(() => {
    if (!settingsLoaded) return;
    if (settings.darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [settings.darkMode, settingsLoaded]);

  // ── Browser/OS detection ────────────────────────────────────────────
  useEffect(() => {
    if (typeof window !== "undefined") {
      const ua = navigator.userAgent;
      let os = "Windows";
      let browser = "Chrome";

      if (ua.includes("Macintosh") || ua.includes("Mac OS X")) os = "macOS";
      else if (ua.includes("iPhone")) os = "iOS (iPhone)";
      else if (ua.includes("iPad")) os = "iOS (iPad)";
      else if (ua.includes("Android")) os = "Android";
      else if (ua.includes("Linux")) os = "Linux";

      if (ua.includes("Firefox")) browser = "Firefox";
      else if (ua.includes("Edge") || ua.includes("Edg")) browser = "Edge";
      else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
      else if (ua.includes("Chrome")) browser = "Chrome";

      setCurrentDevice(`${browser} on ${os}`);
    }
  }, []);

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return "Current session";
    try {
      const d = new Date(isoString);
      return `Active since ${d.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })}`;
    } catch {
      return "Current session";
    }
  };

  // ── Handlers ────────────────────────────────────────────────────────
  const handleLogoutConfirm = async () => {
    setShowLogoutModal(false);
    await signOut("/login");
  };

  const handleDeleteConfirm = async () => {
    setDeleteBusy(true);
    setDeleteError("");
    try {
      const token = session?.access_token || "";
      const res = await fetch(`${API_URL}/api/user`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete account");
      setShowDeleteModal(false);
      await signOut("/login");
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete account");
    } finally {
      setDeleteBusy(false);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordError("");
    setPasswordSuccess(false);
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }
    setPasswordBusy(true);
    try {
      const { supabase } = await import("@/lib/supabase");
      if (!supabase) throw new Error("Supabase is not configured.");
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setPasswordError(error.message);
      } else {
        setPasswordSuccess(true);
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => {
          setShowPasswordModal(false);
          setPasswordSuccess(false);
        }, 2000);
      }
    } catch (err: any) {
      setPasswordError(err.message || "Failed to update password");
    } finally {
      setPasswordBusy(false);
    }
  };

  const handleEmailUpdate = async () => {
    setEmailError("");
    setEmailSuccess(false);
    if (!newEmail || !/\S+@\S+\.\S+/.test(newEmail)) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    setEmailBusy(true);
    try {
      const { supabase } = await import("@/lib/supabase");
      if (!supabase) throw new Error("Supabase is not configured.");
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) {
        setEmailError(error.message);
      } else {
        setEmailSuccess(true);
        setNewEmail("");
        setTimeout(() => {
          setShowEmailModal(false);
          setEmailSuccess(false);
        }, 3000);
      }
    } catch (err: any) {
      setEmailError(err.message || "Failed to update email");
    } finally {
      setEmailBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 bg-gradient-to-b from-white to-warm-paper">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-ink-navy/5">
              <svg className="h-6 w-6 text-ink-navy" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.32 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
              </svg>
            </div>
            <div>
              <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-navy">Settings</h1>
              <p className="mt-0.5 text-sm text-slate-blue">Manage your preferences and account settings.</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-8 flex gap-1 rounded-lg bg-ink-navy/5 p-1">
            {tabs.map((t, i) => (
              <button
                key={t}
                onClick={() => setTab(i)}
                className={cn(
                  "flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all",
                  tab === i ? "bg-white text-ink-navy shadow-sm" : "text-slate-blue hover:text-ink-navy"
                )}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Saved toast */}
          {saved && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-teal-50 border border-teal-100 px-4 py-2.5 text-xs font-semibold text-teal-700 animate-in fade-in slide-in-from-top-2 duration-300">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M5 13l4 4L19 7"/></svg>
              Settings saved
            </div>
          )}

          <div className="mt-6 space-y-5">
            {/* ── Notifications tab ─────────────────────────────────────── */}
            {tab === 0 && (
              <div className="rounded-2xl border border-ink-navy/10 bg-white p-6 shadow-sm">
                <h2 className="font-display text-lg font-semibold text-ink-navy">Notification preferences</h2>
                <p className="mt-1 text-sm text-slate-blue">Choose how and when we notify you about scheme updates.</p>
                <div className="mt-5 space-y-3">
                  <Toggle enabled={settings.emailNotifs} onChange={(v) => updateSetting("emailNotifs", v)} label="Email notifications" desc="New matches, deadline reminders, application updates" />
                  <Toggle enabled={settings.smsNotifs} onChange={(v) => updateSetting("smsNotifs", v)} label="SMS alerts" desc="Critical deadline reminders and approval updates" />
                  <Toggle enabled={settings.pushNotifs} onChange={(v) => updateSetting("pushNotifs", v)} label="Push notifications" desc="Browser notifications for real-time updates" />
                </div>
                <div className="mt-5 border-t border-ink-navy/10 pt-5">
                  <p className="text-sm font-medium text-ink-navy">Notification quiet hours</p>
                  <p className="mt-1 text-xs text-slate-blue-400">No notifications will be sent during this period.</p>
                  <div className="mt-3 flex gap-3">
                    <select
                      value={settings.quietStart}
                      onChange={(e) => updateSetting("quietStart", parseInt(e.target.value))}
                      className="rounded-lg border-2 border-ink-navy/15 bg-white px-3 py-2 text-sm text-ink-navy focus:border-signal-orange focus:outline-none"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>{String(i).padStart(2, "0")}:00</option>
                      ))}
                    </select>
                    <span className="flex items-center text-sm text-slate-blue-400">to</span>
                    <select
                      value={settings.quietEnd}
                      onChange={(e) => updateSetting("quietEnd", parseInt(e.target.value))}
                      className="rounded-lg border-2 border-ink-navy/15 bg-white px-3 py-2 text-sm text-ink-navy focus:border-signal-orange focus:outline-none"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>{String(i).padStart(2, "0")}:00</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* ── Appearance tab ────────────────────────────────────────── */}
            {tab === 1 && (
              <div className="rounded-2xl border border-ink-navy/10 bg-white p-6 shadow-sm">
                <h2 className="font-display text-lg font-semibold text-ink-navy">Appearance</h2>
                <p className="mt-1 text-sm text-slate-blue">Customize how the dashboard looks.</p>
                <div className="mt-5 space-y-3">
                  <Toggle enabled={settings.darkMode} onChange={(v) => updateSetting("darkMode", v)} label="Dark mode" desc="Switch between light and dark theme" />
                  <Toggle enabled={settings.compactView} onChange={(v) => updateSetting("compactView", v)} label="Compact view" desc="Show more content with reduced spacing" />
                </div>
                <div className="mt-5 border-t border-ink-navy/10 pt-5">
                  <p className="text-sm font-medium text-ink-navy">Language</p>
                  <p className="mt-1 text-xs text-slate-blue-400">Choose your preferred language for scheme information.</p>
                  <select
                    value={settings.language}
                    onChange={(e) => updateSetting("language", e.target.value)}
                    className="mt-3 block w-full rounded-lg border-2 border-ink-navy/15 bg-white px-3.5 py-2.5 text-sm text-ink-navy focus:border-signal-orange focus:outline-none"
                  >
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                    <option value="or">Odia</option>
                    <option value="ta">Tamil</option>
                    <option value="bn">Bengali</option>
                    <option value="mr">Marathi</option>
                    <option value="te">Telugu</option>
                    <option value="kn">Kannada</option>
                  </select>
                </div>
              </div>
            )}

            {/* ── Privacy tab ───────────────────────────────────────────── */}
            {tab === 2 && (
              <div className="rounded-2xl border border-ink-navy/10 bg-white p-6 shadow-sm">
                <h2 className="font-display text-lg font-semibold text-ink-navy">Privacy & data</h2>
                <p className="mt-1 text-sm text-slate-blue">Control how your data is used and shared.</p>
                <div className="mt-5 space-y-3">
                  <Toggle enabled={settings.shareData} onChange={(v) => updateSetting("shareData", v)} label="Scheme improvement data" desc="Share anonymized eligibility data to improve scheme matching for everyone" />
                  <Toggle enabled={settings.analytics} onChange={(v) => updateSetting("analytics", v)} label="Usage analytics" desc="Help us improve by sharing anonymous usage data" />
                </div>
                <div className="mt-5 rounded-xl bg-verified-teal/5 px-4 py-3">
                  <div className="flex items-start gap-3">
                    <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-verified-teal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-verified-teal">Your data is encrypted</p>
                      <p className="mt-0.5 text-xs text-slate-blue">All personal information is encrypted at rest and in transit. We never share your data with third parties.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Account tab ───────────────────────────────────────────── */}
            {tab === 3 && (
              <div className="space-y-5">
                <div className="rounded-2xl border border-ink-navy/10 bg-white p-6 shadow-sm">
                  <h2 className="font-display text-lg font-semibold text-ink-navy">Account details</h2>
                  <p className="mt-1 text-sm text-slate-blue">Update your login information.</p>
                  <div className="mt-5 space-y-4">
                    <Input label="Email address" type="email" defaultValue={user?.email || ""} disabled />
                    <div className="flex gap-3">
                      <Button size="sm" onClick={() => { setNewEmail(""); setEmailError(""); setEmailSuccess(false); setShowEmailModal(true); }}>Update email</Button>
                      <Button variant="outline" size="sm" onClick={() => { setNewPassword(""); setConfirmPassword(""); setPasswordError(""); setPasswordSuccess(false); setShowPasswordModal(true); }}>Change password</Button>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-ink-navy/10 bg-white p-6 shadow-sm">
                  <h2 className="font-display text-lg font-semibold text-ink-navy">Sessions</h2>
                  <p className="mt-1 text-sm text-slate-blue">Active login sessions across devices.</p>
                  <div className="mt-4 space-y-3">
                    {[
                      { device: currentDevice, active: true, time: formatDateTime(user?.last_sign_in_at) },
                    ].map((s) => (
                      <div key={s.device} className="flex items-center justify-between rounded-lg bg-warm-paper/50 px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={cn("h-2 w-2 rounded-full", s.active ? "bg-verified-teal" : "bg-ink-navy/15")} />
                          <div>
                            <p className="text-sm font-medium text-ink-navy">{s.device}</p>
                            <p className="text-xs text-slate-blue-400">{s.time}</p>
                          </div>
                        </div>
                        {s.active ? (
                          <button
                            onClick={() => setShowLogoutModal(true)}
                            className="text-xs font-semibold text-rose-500 hover:text-rose-600 transition-colors"
                          >
                            Logout
                          </button>
                        ) : (
                          <button className="text-xs font-medium text-slate-blue-400 hover:text-caution-amber">Revoke</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-caution-amber/20 bg-white p-6 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-caution-amber/10">
                      <svg className="h-4 w-4 text-caution-amber" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="font-display text-base font-semibold text-ink-navy">Danger zone</h2>
                      <p className="mt-1 text-sm text-slate-blue">Permanently delete your account and all associated data.</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDeleteModal(true)}
                        className="mt-3 border-caution-amber/30 text-caution-amber hover:bg-caution-amber/5"
                      >
                        Delete account
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── Custom Modals ──────────────────────────────────────────────── */}

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-navy/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white border border-slate-100 p-6 shadow-xl animate-in fade-in zoom-in duration-200">
            <h3 className="font-display text-lg font-bold text-ink-navy">Confirm Logout</h3>
            <p className="mt-2 text-sm text-slate-blue leading-relaxed">
              Are you sure you want to log out of this session?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleLogoutConfirm}
                className="rounded-xl bg-rose-500 px-4 py-2 text-xs font-bold text-white hover:bg-rose-600 transition-all shadow-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-navy/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white border border-slate-100 p-6 shadow-xl animate-in fade-in zoom-in duration-200">
            <h3 className="font-display text-lg font-bold text-caution-amber">Delete Account</h3>
            <p className="mt-2 text-sm text-slate-blue leading-relaxed">
              This action is permanent and cannot be undone. All your documents, matches, and account records will be permanently erased.
            </p>
            {deleteError && (
              <p className="mt-3 text-xs text-rose-500 bg-rose-50 p-2 rounded-lg border border-rose-100">{deleteError}</p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all"
                disabled={deleteBusy}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="rounded-xl bg-caution-amber px-4 py-2 text-xs font-bold text-white hover:bg-amber-600 transition-all shadow-sm"
                disabled={deleteBusy}
              >
                {deleteBusy ? "Deleting…" : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-navy/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white border border-slate-100 p-6 shadow-xl animate-in fade-in zoom-in duration-200">
            <h3 className="font-display text-lg font-bold text-ink-navy">Change Password</h3>
            <p className="mt-1 text-xs text-slate-blue-400 mb-4">Enter and confirm your new password below.</p>

            <div className="space-y-3">
              <Input
                label="New Password"
                type="password"
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={passwordBusy}
              />
              <Input
                label="Confirm Password"
                type="password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={passwordBusy}
              />
            </div>

            {passwordError && (
              <p className="mt-3 text-xs text-rose-500 bg-rose-50 p-2 rounded-lg border border-rose-100">{passwordError}</p>
            )}
            {passwordSuccess && (
              <p className="mt-3 text-xs text-teal-600 bg-teal-50 p-2 rounded-lg border border-teal-100">✓ Password successfully updated!</p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all"
                disabled={passwordBusy}
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordChange}
                className="rounded-xl bg-signal-orange px-4 py-2 text-xs font-bold text-white hover:bg-orange-600 transition-all shadow-sm"
                disabled={passwordBusy}
              >
                {passwordBusy ? "Updating…" : "Change Password"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-navy/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white border border-slate-100 p-6 shadow-xl animate-in fade-in zoom-in duration-200">
            <h3 className="font-display text-lg font-bold text-ink-navy">Update Email</h3>
            <p className="mt-1 text-xs text-slate-blue-400 mb-4">A confirmation link will be sent to your new email address.</p>

            <Input
              label="New Email Address"
              type="email"
              placeholder="you@example.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              disabled={emailBusy}
            />

            {emailError && (
              <p className="mt-3 text-xs text-rose-500 bg-rose-50 p-2 rounded-lg border border-rose-100">{emailError}</p>
            )}
            {emailSuccess && (
              <p className="mt-3 text-xs text-teal-600 bg-teal-50 p-2 rounded-lg border border-teal-100">✓ Confirmation email sent! Check your inbox.</p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowEmailModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all"
                disabled={emailBusy}
              >
                Cancel
              </button>
              <button
                onClick={handleEmailUpdate}
                className="rounded-xl bg-signal-orange px-4 py-2 text-xs font-bold text-white hover:bg-orange-600 transition-all shadow-sm"
                disabled={emailBusy}
              >
                {emailBusy ? "Sending…" : "Update Email"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
