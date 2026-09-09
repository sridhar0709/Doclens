"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

export function HeroScene() {
  const [reducedMotion, setReducedMotion] = useState(false);
  const sceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (reducedMotion || !sceneRef.current) return;
    const ctx = gsap.context(() => {
      // Animate dashed paths
      gsap.to(".path-dash", {
        strokeDashoffset: -24,
        duration: 0.8,
        repeat: -1,
        ease: "none",
      });

      // Scheme cards fade-in staggered
      gsap.fromTo(".scheme-card", 
        { opacity: 0, y: 12 },
        { opacity: 0.95, y: 0, duration: 0.6, stagger: 0.25, delay: 0.8, ease: "power2.out" }
      );

      // Confidence rings animate in
      gsap.fromTo(".conf-ring-fill", 
        { strokeDashoffset: (i, el) => el.getAttribute("data-full") },
        { 
          strokeDashoffset: (i, el) => el.getAttribute("data-target"),
          duration: 1.2,
          delay: 1.2,
          ease: "power2.out",
          stagger: 0.2
        }
      );

      // Orange dot accents pulse
      gsap.to(".accent-dot", {
        opacity: 0.7,
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: { each: 0.4, from: "random" },
      });
    }, sceneRef);

    return () => ctx.revert();
  }, [reducedMotion]);

  const circumferences = [113, 113, 113];

  return (
    <div
      ref={sceneRef}
      className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-ink-navy/8 via-warm-paper to-ink-navy/5 border border-ink-navy/10 shadow-lg shadow-ink-navy/5"
    >
      <svg
        viewBox="0 0 720 460"
        className="h-auto w-full"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Illustration showing a citizen profile connecting to matched welfare schemes"
      >
        <defs>
          <linearGradient id="glow-orange" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="glow-teal" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="glow-amber" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="govt-glow" x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0%" stopColor="#3730A3" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#3730A3" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="card-shine" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <filter id="soft-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="strong-glow">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ===== BACKGROUND GLOW ===== */}
        <ellipse cx="360" cy="200" rx="300" ry="200" fill="url(#govt-glow)" aria-hidden="true" />

        {/* ===== GOVERNMENT BUILDING SILHOUETTE (center backdrop) ===== */}
        <g opacity="0.12" aria-hidden="true" className="building-silhouette">
          {/* Main building body */}
          <rect x="160" y="130" width="400" height="330" rx="3" fill="#3730A3" />
          {/* Central dome */}
          <path d="M280 130 Q360 30 440 130 Z" fill="#3730A3" />
          {/* Dome base */}
          <rect x="270" y="125" width="180" height="15" rx="3" fill="#3730A3" />
          {/* Dome spire */}
          <line x1="360" y1="30" x2="360" y2="10" stroke="#3730A3" strokeWidth="4" />
          <circle cx="360" cy="8" r="6" fill="#3730A3" />
          {/* Grand entrance arch */}
          <path d="M300 460 L300 350 Q360 310 420 350 L420 460 Z" fill="#3730A3" opacity="0.08" />
          {/* Main colonnade — 9 columns */}
          {[190, 230, 270, 310, 360, 410, 450, 490, 530].map((cx, i) => (
            <g key={i}>
              <rect x={cx - 6} y="180" width="12" height="280" fill="#3730A3" opacity="0.5" />
              {/* Column capital */}
              <rect x={cx - 10} y="170" width="20" height="12" rx="2" fill="#3730A3" opacity="0.4" />
            </g>
          ))}
          {/* Horizontal beam above columns */}
          <rect x="170" y="160" width="380" height="14" rx="2" fill="#3730A3" opacity="0.35" />
          {/* Top cornice */}
          <rect x="155" y="118" width="410" height="8" rx="2" fill="#3730A3" opacity="0.4" />
          {/* Wing sections — left */}
          <rect x="130" y="200" width="40" height="260" fill="#3730A3" opacity="0.25" />
          {/* Wing sections — right */}
          <rect x="550" y="200" width="40" height="260" fill="#3730A3" opacity="0.25" />
          {/* Left wing smaller dome */}
          <path d="M140 200 Q150 170 170 200 Z" fill="#3730A3" opacity="0.3" />
          {/* Right wing smaller dome */}
          <path d="M550 200 Q560 170 580 200 Z" fill="#3730A3" opacity="0.3" />
        </g>

        {/* ===== GLOW ACCENTS ===== */}
        <ellipse cx="200" cy="240" rx="140" ry="120" fill="url(#glow-orange)" aria-hidden="true" />
        <ellipse cx="530" cy="170" rx="130" ry="110" fill="url(#glow-teal)" aria-hidden="true" />
        <ellipse cx="560" cy="330" rx="100" ry="80" fill="url(#glow-amber)" aria-hidden="true" />

        {/* ===== MIDGROUND: Node flow ===== */}

        {/* Left: Citizen profile icon */}
        <g transform="translate(95, 185)">
          <circle cx="45" cy="45" r="45" fill="#3730A3" opacity="0.06" />
          <circle cx="45" cy="45" r="38" fill="#3730A3" opacity="0.04" />
          {/* Head */}
          <circle cx="45" cy="28" r="12" fill="#8B5CF6" opacity="0.85" />
          {/* Body/shoulders */}
          <path d="M28 56 Q45 48 62 56 L68 78 Q45 73 22 78 Z" fill="#8B5CF6" opacity="0.6" />
          {/* Small document icon next to person */}
          <rect x="70" y="35" width="16" height="20" rx="2" fill="#475569" opacity="0.15" />
          <line x1="74" y1="40" x2="82" y2="40" stroke="#475569" strokeWidth="1.5" opacity="0.2" />
          <line x1="74" y1="44" x2="82" y2="44" stroke="#475569" strokeWidth="1.5" opacity="0.2" />
          <line x1="74" y1="48" x2="80" y2="48" stroke="#475569" strokeWidth="1.5" opacity="0.2" />
          {/* Label */}
          <text x="45" y="105" textAnchor="middle" fill="#475569" fontSize="12" fontFamily="Inter, sans-serif" fontWeight="600">
            Your profile
          </text>
        </g>

        {/* Animated flow paths */}
        {!reducedMotion ? (
          <>
            {/* Path 1 — orange (high confidence) */}
            <path d="M180 200 C 250 140, 320 130, 400 150" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeDasharray="6 6" className="path-dash" markerEnd="url(#dot-filled)" />
            <circle r="5" fill="#8B5CF6" filter="url(#soft-glow)">
              <animateMotion dur="3s" repeatCount="indefinite" path="M180 200 C 250 140, 320 130, 400 150" />
            </circle>
            {/* Path 2 — teal (high-medium) */}
            <path d="M180 225 C 260 220, 330 215, 410 220" fill="none" stroke="#06B6D4" strokeWidth="2" strokeDasharray="6 6" className="path-dash" markerEnd="url(#dot-teal)" style={{ animationDelay: "-0.4s" }} />
            <circle r="5" fill="#06B6D4" filter="url(#soft-glow)">
              <animateMotion dur="3.5s" repeatCount="indefinite" begin="-0.4s" path="M180 225 C 260 220, 330 215, 410 220" />
            </circle>
            {/* Path 3 — amber (boundary) */}
            <path d="M180 250 C 250 300, 320 310, 400 280" fill="none" stroke="#F59E0B" strokeWidth="2" strokeDasharray="6 6" className="path-dash" markerEnd="url(#dot-amber)" style={{ animationDelay: "-0.8s" }} />
            <circle r="5" fill="#F59E0B" filter="url(#soft-glow)">
              <animateMotion dur="4s" repeatCount="indefinite" begin="-0.8s" path="M180 250 C 250 300, 320 310, 400 280" />
            </circle>
          </>
        ) : (
          <>
            <path d="M180 200 C 250 140, 320 130, 400 150" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeDasharray="6 6" />
            <path d="M180 225 C 260 220, 330 215, 410 220" fill="none" stroke="#06B6D4" strokeWidth="2" strokeDasharray="6 6" />
            <path d="M180 250 C 250 300, 320 310, 400 280" fill="none" stroke="#F59E0B" strokeWidth="2" strokeDasharray="6 6" />
          </>
        )}

        {/* Scheme result cards */}
        <g className="scheme-card" transform="translate(420, 115)">
          <rect x="0" y="0" width="230" height="64" rx="10" fill="white" stroke="#06B6D4" strokeWidth="1.5" opacity="0.95" />
          <rect x="0" y="0" width="230" height="64" rx="10" fill="url(#card-shine)" />
          <circle cx="32" cy="32" r="20" fill="none" stroke="#06B6D4" strokeWidth="3" opacity="0.15" />
          <circle className="conf-ring-fill" cx="32" cy="32" r="20" fill="none" stroke="#06B6D4" strokeWidth="3" strokeDasharray="126" data-full="126" data-target="13" strokeLinecap="round" transform="rotate(-90, 32, 32)" opacity="0.85" />
          <text x="32" y="37" textAnchor="middle" fill="#06B6D4" fontSize="12" fontFamily="JetBrains Mono, monospace" fontWeight="700">92%</text>
          <text x="60" y="26" fill="#3730A3" fontSize="14" fontFamily="Fraunces, serif" fontWeight="600">PM-KISAN</text>
          <text x="60" y="42" fill="#475569" fontSize="10" fontFamily="Inter, sans-serif">Income support · ₹6,000/yr</text>
          <text x="60" y="54" fill="#06B6D4" fontSize="9" fontFamily="Inter, sans-serif" fontWeight="600">High confidence</text>
        </g>

        <g className="scheme-card" transform="translate(430, 190)">
          <rect x="0" y="0" width="230" height="64" rx="10" fill="white" stroke="#06B6D4" strokeWidth="1.5" opacity="0.95" />
          <rect x="0" y="0" width="230" height="64" rx="10" fill="url(#card-shine)" />
          <circle cx="32" cy="32" r="20" fill="none" stroke="#06B6D4" strokeWidth="3" opacity="0.15" />
          <circle className="conf-ring-fill" cx="32" cy="32" r="20" fill="none" stroke="#06B6D4" strokeWidth="3" strokeDasharray="126" data-full="126" data-target="32" strokeLinecap="round" transform="rotate(-90, 32, 32)" opacity="0.85" />
          <text x="32" y="37" textAnchor="middle" fill="#06B6D4" fontSize="12" fontFamily="JetBrains Mono, monospace" fontWeight="700">76%</text>
          <text x="60" y="26" fill="#3730A3" fontSize="14" fontFamily="Fraunces, serif" fontWeight="600">KALIA</text>
          <text x="60" y="42" fill="#475569" fontSize="10" fontFamily="Inter, sans-serif">Farmer welfare · Odisha</text>
          <text x="60" y="54" fill="#06B6D4" fontSize="9" fontFamily="Inter, sans-serif" fontWeight="600">Likely eligible</text>
        </g>

        <g className="scheme-card" transform="translate(425, 265)">
          <rect x="0" y="0" width="230" height="64" rx="10" fill="white" stroke="#F59E0B" strokeWidth="1.5" opacity="0.95" />
          <rect x="0" y="0" width="230" height="64" rx="10" fill="url(#card-shine)" />
          <circle cx="32" cy="32" r="20" fill="none" stroke="#F59E0B" strokeWidth="3" opacity="0.15" />
          <circle className="conf-ring-fill" cx="32" cy="32" r="20" fill="none" stroke="#F59E0B" strokeWidth="3" strokeDasharray="126" data-full="126" data-target="70" strokeLinecap="round" transform="rotate(-90, 32, 32)" opacity="0.85" />
          <text x="32" y="37" textAnchor="middle" fill="#F59E0B" fontSize="12" fontFamily="JetBrains Mono, monospace" fontWeight="700">45%</text>
          <text x="60" y="26" fill="#3730A3" fontSize="14" fontFamily="Fraunces, serif" fontWeight="600">Ayushman Bharat</text>
          <text x="60" y="42" fill="#475569" fontSize="10" fontFamily="Inter, sans-serif">Health coverage · ₹5L</text>
          <text x="60" y="54" fill="#F59E0B" fontSize="9" fontFamily="Inter, sans-serif" fontWeight="600">Verify with authority</text>
        </g>

        {/* Bottom badge — deterministic engine */}
        <g transform="translate(360, 430)">
          <rect x="-130" y="-16" width="260" height="32" rx="16" fill="#3730A3" opacity="0.06" />
          <circle cx="-108" cy="0" r="4" fill="#06B6D4" opacity="0.85" />
          <text x="-98" y="5" textAnchor="start" fill="#475569" fontSize="11" fontFamily="JetBrains Mono, monospace" fontWeight="500">
            deterministic engine · auditable · open source
          </text>
        </g>

        {/* Decorative accent dots */}
        {!reducedMotion && (
          <g aria-hidden="true">
            {[
              { cx: 60, cy: 70, r: 3, color: "#8B5CF6" },
              { cx: 660, cy: 50, r: 2.5, color: "#8B5CF6" },
              { cx: 680, cy: 400, r: 3.5, color: "#8B5CF6" },
              { cx: 40, cy: 400, r: 2, color: "#EC4899" },
              { cx: 350, cy: 60, r: 2, color: "#8B5CF6" },
              { cx: 150, cy: 430, r: 2.5, color: "#06B6D4" },
            ].map((dot, i) => (
              <circle key={i} cx={dot.cx} cy={dot.cy} r={dot.r} fill={dot.color} opacity="0.3" className="accent-dot" />
            ))}
          </g>
        )}
      </svg>
    </div>
  );
}
