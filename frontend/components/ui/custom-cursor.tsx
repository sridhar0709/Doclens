"use client";

import { useEffect, useRef } from "react";

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const badgeMap: Record<string, string> = {
  "text-verified-teal": "#06B6D4",
  "text-caution-amber": "#F59E0B",
  "text-slate-blue": "#475569",
};

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!fine.matches || rm.matches) return;

    const style = document.createElement("style");
    style.textContent = `
      body, body * { cursor: none !important; }
      input, textarea { cursor: text !important; }
      button, a, [role="button"], select, option { cursor: pointer !important; }
    `;
    document.head.appendChild(style);

    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let dx = mx, dy = my;
    let sx = mx, sy = my;
    let scale = 1, scaleTarget = 1;
    let opacity = 0, opacityTarget = 0;
    let initialMoved = false;
    let color = "#8B5CF6", colorTarget = "#8B5CF6";
    let hidden = true;
    let mag: Element | null = null;
    let isResting = false;

    const resetMag = (el: Element) => {
      (el as HTMLElement).style.transition = "transform 0.25s ease";
      (el as HTMLElement).style.transform = "translate(0, 0)";
    };

    const tick = () => {
      if (
        Math.abs(mx - dx) < 0.05 &&
        Math.abs(my - dy) < 0.05 &&
        Math.abs(mx - sx) < 0.05 &&
        Math.abs(my - sy) < 0.05 &&
        Math.abs(scaleTarget - scale) < 0.005 &&
        Math.abs(opacityTarget - opacity) < 0.005 &&
        color === colorTarget
      ) {
        if (!isResting) {
          dx = mx; dy = my; sx = mx; sy = my; scale = scaleTarget; opacity = opacityTarget; color = colorTarget;
          const dot = dotRef.current;
          const ring = ringRef.current;
          if (dot) {
            dot.style.transform = `translate3d(${dx - 3.5}px, ${dy - 3.5}px, 0)`;
            dot.style.opacity = String(!initialMoved || hidden ? 0 : Math.min(1, opacity));
          }
          if (ring) {
            const s = !initialMoved || hidden ? 0.01 : Math.max(0.01, scale);
            ring.style.transform = `translate3d(${sx - 15}px, ${sy - 15}px, 0) scale(${s})`;
            ring.style.opacity = String(!initialMoved || hidden ? 0 : Math.min(1, Math.max(0.08, opacity * 0.4)));
            ring.style.borderColor = color;
          }
          isResting = true;
        }
        requestAnimationFrame(tick);
        return;
      }

      isResting = false;
      dx += (mx - dx) * 0.3;
      dy += (my - dy) * 0.3;
      sx += (dx - sx) * 0.12;
      sy += (dy - sy) * 0.12;
      scale += (scaleTarget - scale) * 0.12;
      opacity += (opacityTarget - opacity) * 0.12;
      color = colorTarget;

      const dot = dotRef.current;
      const ring = ringRef.current;

      if (dot) {
        dot.style.transform = `translate3d(${dx - 3.5}px, ${dy - 3.5}px, 0)`;
        dot.style.opacity = String(!initialMoved || hidden ? 0 : Math.min(1, opacity));
      }
      if (ring) {
        const s = !initialMoved || hidden ? 0.01 : Math.max(0.01, scale);
        ring.style.transform = `translate3d(${sx - 15}px, ${sy - 15}px, 0) scale(${s})`;
        ring.style.opacity = String(!initialMoved || hidden ? 0 : Math.min(1, Math.max(0.08, opacity * 0.4)));
        ring.style.borderColor = color;
      }

      requestAnimationFrame(tick);
    };

    let lastTargetCheck = 0;

    const hover = (cx: number, cy: number, target: HTMLElement | null) => {
      mx = cx; my = cy;
      isResting = false;
      initialMoved = true;
      hidden = false;
      opacityTarget = 1;

      if (!target) {
        hidden = true;
        if (mag) { resetMag(mag); mag = null; }
        return;
      }

      const t = target.tagName;
      if (t === "INPUT" || t === "TEXTAREA" || target.isContentEditable) {
        hidden = true;
        if (mag) { resetMag(mag); mag = null; }
        return;
      }

      const now = performance.now();
      if (now - lastTargetCheck < 30) return; // Throttle expensive closest calculations to ~30fps
      lastTargetCheck = now;

      const int = target.closest<HTMLElement>(
        "a, button, [role=button], [role=link], label"
      );

      if (!int) {
        hidden = false;
        scaleTarget = 1;
        opacityTarget = 1;
        colorTarget = "#8B5CF6";
        if (mag) { resetMag(mag); mag = null; }
        return;
      }

      hidden = false;

      // Badge color detection
      let c: HTMLElement | null = int;
      let depth = 0;
      while (c && depth < 3) {
        for (const [cls, clr] of Object.entries(badgeMap)) {
          if (c.classList.contains(cls)) {
            scaleTarget = 1.6;
            opacityTarget = 0.25;
            colorTarget = clr;
            if (mag) { resetMag(mag); mag = null; }
            return;
          }
        }
        c = c.parentElement;
        depth++;
      }

      // Primary CTA magnetic
      if (int.closest('[href="/register"], [href*="get-started"], [href*="Get-Started"]')) {
        scaleTarget = 1.4;
        opacityTarget = 0.2;
        colorTarget = "#8B5CF6";
      } else {
        scaleTarget = 1.6;
        opacityTarget = 0.2;
        colorTarget = "#8B5CF6";
        if (mag) { resetMag(mag); mag = null; }
      }
    };

    const onMove = (e: MouseEvent) => hover(e.clientX, e.clientY, e.target as HTMLElement);
    const onLeave = () => { hidden = true; if (mag) resetMag(mag); mag = null; };

    document.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);

    requestAnimationFrame(tick);

    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      style.remove();
    };
  }, []);

  return (
    <>
      <div
        ref={dotRef}
        className="pointer-events-none fixed"
        style={{
          top: 0, left: 0,
          zIndex: 999999,
          width: "7px", height: "7px",
          borderRadius: "50%",
          backgroundColor: "#8B5CF6",
          willChange: "transform",
          opacity: 0,
        }}
      />
      <div
        ref={ringRef}
        className="pointer-events-none fixed"
        style={{
          top: 0, left: 0,
          zIndex: 999998,
          width: "30px", height: "30px",
          borderRadius: "50%",
          border: "1px solid #475569",
          willChange: "transform",
          opacity: 0,
        }}
      />
    </>
  );
}
