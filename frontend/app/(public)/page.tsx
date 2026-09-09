"use client";

import { useEffect, useState } from "react";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { StatsBar } from "@/components/landing/stats-bar";
import { FAQ } from "@/components/landing/faq";

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        suppressHydrationWarning
        className="fixed inset-0 z-[60] flex items-center justify-center bg-gradient-to-br from-[#3730A3] via-[#1E1B4B] to-[#312E81]"
      >
        <div suppressHydrationWarning className="w-[300px] max-w-full px-4 sm:w-[400px]">
          <video
            suppressHydrationWarning
            src="/assets/loader-ring.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="w-full"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <Hero />
        <div className="-mt-8 pb-16 sm:-mt-12 sm:pb-20">
          <StatsBar />
        </div>
        <Features />
        <FAQ />
      </main>
    </div>
  );
}
