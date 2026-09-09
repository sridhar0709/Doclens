"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { user, signOut, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname() || "";
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close mobile menu on path change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const initials = user?.user_metadata?.full_name
    ? (user.user_metadata.full_name as string)
        .split(" ")
        .map((n: string) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? "U";

  async function handleSignOut() {
    setMenuOpen(false);
    setMobileMenuOpen(false);
    await signOut();
    router.push("/");
  }

  const isDashboard = pathname === "/dashboard";
  const isHome = pathname === "/";
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");
  const showBackButton = !!user && !loading && !isDashboard && !isHome && !isAuthPage;
  const showBackToHome = !user && !loading && !isHome && !isAuthPage && !pathname.startsWith("/schemes");

  function getNavLinkClass(href: string) {
    const isActive = pathname === href || (href !== "/" && href !== "/dashboard" && pathname.startsWith(href));
    return cn(
      "transition-all py-1 font-medium text-[13.5px]",
      isActive
        ? "text-[#1E1B4B] font-bold border-b-2 border-orange-500"
        : "text-gray-600 hover:text-orange-500"
    );
  }

  return (
    <div className="sticky top-0 z-50 flex flex-col w-full shadow-2xs">
      <header className="bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
          <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2.5">
            <img src="/assets/logo-bg.png" alt="DocLens" className="w-8 h-8 object-contain" />
            <span className="font-extrabold text-[17px] text-[#1E1B4B] tracking-tight">DocLens</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {user ? (
              <>
                <Link href="/dashboard" className={getNavLinkClass("/dashboard")}>
                  Dashboard
                </Link>
                <Link href="/schemes" className={getNavLinkClass("/schemes")}>
                  Browse Schemes
                </Link>
                <Link href="/documents" className={getNavLinkClass("/documents")}>
                  Document Vault
                </Link>
                <Link href="/chat" className={getNavLinkClass("/chat")}>
                  AI Assistant
                </Link>
                <Link href="/about" className={getNavLinkClass("/about")}>
                  About
                </Link>
              </>
            ) : (
              <>
                <Link href="/#how-it-works" className={getNavLinkClass("/#how-it-works")}>
                  How It Works
                </Link>
                <Link href="/schemes" className={getNavLinkClass("/schemes")}>
                  Browse Schemes
                </Link>
                <Link href="/chat" className={getNavLinkClass("/chat")}>
                  AI Assistant
                </Link>
                <Link href="/about" className={getNavLinkClass("/about")}>
                  About
                </Link>
              </>
            )}
          </nav>

          <div className="flex items-center gap-3">
            {loading ? (
              <div className="h-8 w-8 rounded-full bg-gray-100 animate-pulse" />
            ) : user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  className="flex items-center gap-2 rounded-full px-3 py-1.5 bg-orange-50 border border-orange-100 hover:bg-orange-100 transition-all"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-[11px] font-bold text-white">
                    {initials}
                  </span>
                  <span className="hidden sm:block text-sm font-semibold text-[#1E1B4B] max-w-[120px] truncate">
                    {user.user_metadata?.full_name ?? user.email}
                  </span>
                  <svg className="h-3.5 w-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white shadow-lg border border-gray-100 py-1 z-50">
                    <div className="px-4 py-2.5 border-b border-gray-100">
                      <p className="text-xs font-semibold text-[#1E1B4B] truncate">{user.email}</p>
                    </div>
                    <Link
                      href="/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Profile
                    </Link>
                    <Link
                      href="/documents"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Document Vault
                    </Link>

                    <Link
                      href="/settings"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Settings
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors border-t border-gray-100 mt-1"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden sm:inline-block px-4 py-2 text-sm font-semibold text-gray-700 hover:text-[#1E1B4B] transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-orange-500 rounded-full hover:bg-orange-600 active:scale-95 transition-all shadow-md shadow-orange-500/20"
                >
                  Check Eligibility
                </Link>
              </>
            )}

            {/* Mobile Hamburger Button */}
            <div className="md:hidden relative" ref={mobileMenuRef}>
              <button
                onClick={() => setMobileMenuOpen((o) => !o)}
                className="p-2 rounded-lg text-gray-600 hover:text-[#1E1B4B] hover:bg-gray-100 transition-colors"
                aria-label="Open Navigation Menu"
              >
                {mobileMenuOpen ? (
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>

              {mobileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-xl border border-gray-100 py-2 z-50">
                  {user ? (
                    <>
                      <Link
                        href="/dashboard"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-[#1E1B4B] hover:bg-orange-50 transition-colors"
                      >
                        Dashboard
                      </Link>
                      <Link
                        href="/schemes"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Browse Schemes
                      </Link>
                      <Link
                        href="/documents"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Document Vault
                      </Link>
                      <Link
                        href="/chat"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        AI Assistant
                      </Link>
                      <Link
                        href="/about"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        About
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/#how-it-works"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        How It Works
                      </Link>
                      <Link
                        href="/schemes"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Browse Schemes
                      </Link>
                      <Link
                        href="/chat"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        AI Assistant
                      </Link>
                      <Link
                        href="/about"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        About
                      </Link>

                      <div className="border-t border-gray-100 my-1 pt-1">
                        <Link
                          href="/login"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          Sign In
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Universal Back to Dashboard Header Strip for Logged-In Users on Sub-Pages */}
      {showBackButton && (
        <div className="bg-gradient-to-r from-orange-50/90 via-[#F7F6FC] to-white border-b border-orange-100/80 px-6 lg:px-10 py-2.5 shadow-2xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#1E1B4B] hover:text-orange-600 transition-all py-0.5 group"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500/15 text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition-colors shadow-2xs">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M15 19l-7-7 7-7" />
                </svg>
              </span>
              <span>Back to Dashboard</span>
            </Link>
            <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-gray-500">
              <span>Citizen Workspace</span>
              <span className="h-2 w-2 rounded-full bg-verified-teal animate-pulse" />
            </div>
          </div>
        </div>
      )}

      {/* Back to Home Header Strip for Logged-Out Users on Sub-Pages */}
      {showBackToHome && (
        <div className="bg-gradient-to-r from-slate-50 via-white to-white border-b border-gray-100 px-6 lg:px-10 py-2.5 shadow-2xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#1E1B4B] hover:text-orange-600 transition-all py-0.5 group"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200/60 text-slate-700 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M15 19l-7-7 7-7" />
                </svg>
              </span>
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default Navbar;

