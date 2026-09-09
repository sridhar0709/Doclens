"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChatFloatingButton } from "@/components/ui/chat-floating-button";
import { Footer } from "@/components/ui/footer";
import { Navbar } from "@/components/ui/navbar";
import { useAuth } from "@/hooks/useAuth";

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { session, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [loading, pathname, router, session]);

  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white to-warm-paper">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-navy/10 border-t-signal-orange" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col">{children}</main>
      {pathname !== "/chat" && <Footer />}
      <ChatFloatingButton />
    </div>
  );
}
