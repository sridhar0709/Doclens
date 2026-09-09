"use client";

import { useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    gsap.killTweensOf(el);
    gsap.set(el, { opacity: 0, y: 12 });
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: "power2.out",
      clearProps: "y",
    });
  }, [pathname]);

  return <div ref={elRef}>{children}</div>;
}
