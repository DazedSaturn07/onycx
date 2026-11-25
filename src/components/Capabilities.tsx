"use client";

import React, {
  Component,
  type ErrorInfo,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
} from "react";
import Link from "next/link";
import { capabilityGroups } from "@/data/portfolio";

/* ============================================================================
   TYPES & DATA MODEL
   Cleanly typed so <CapabilitiesSection /> can be imported directly and synced
   with @/data/portfolio capabilityGroups.
   ============================================================================ */

export interface CapabilityItem {
  id: "data" | "ml" | "engineering" | string;
  index: string;
  stageLabel: string;
  pipeline: [string, string];
  telemetryBadge: string;
  title: string;
  description: string;
  skills: string[];
  ctaLabel: string;
  href: string;
}

export interface CapabilitiesSectionProps {
  /** Override capability items if sourcing from CMS or config */
  items?: CapabilityItem[];
  /** Optional custom handler when a card CTA or "See the work" is clicked */
  onNavigate?: (href: string, label: string) => void;
  /** Section anchor ID for smooth navbar scrolling (default: "capabilities") */
  id?: string;
}

const CAPABILITY_METADATA: Record<
  string,
  Pick<
    CapabilityItem,
    "id" | "stageLabel" | "pipeline" | "telemetryBadge" | "ctaLabel" | "href"
  >
> = {
  "01": {
    id: "data",
    stageLabel: "Find the signal",
    pipeline: ["QUESTION", "INSIGHT"],
    telemetryBadge: "SIGNAL · 98.4%",
    ctaLabel: "Explore data projects",
    href: "/projects#analytics",
  },
  "02": {
    id: "ml",
    stageLabel: "Explore the possibilities",
    pipeline: ["EXPLORE", "EVALUATE"],
    telemetryBadge: "MODEL · 0.96 F1",
    ctaLabel: "Explore ML projects",
    href: "/projects#machine-learning",
  },
  "03": {
    id: "engineering",
    stageLabel: "Make it tangible",
    pipeline: ["DESIGN", "DEVELOP"],
    telemetryBadge: "SYSTEM · 60 FPS",
    ctaLabel: "Explore web projects",
    href: "/projects#web-experiences",
  },
};

export const DEFAULT_CAPABILITIES: CapabilityItem[] = capabilityGroups.map(
  (group) => {
    const meta = CAPABILITY_METADATA[group.index] ?? {
      id: `discipline-${group.index}`,
      stageLabel: "Practice",
      pipeline: ["EXPLORE", "DELIVER"] as [string, string],
      telemetryBadge: `AREA · ${group.index}`,
      ctaLabel: "Explore projects",
      href: "/projects",
    };

    return {
      id: meta.id,
      index: group.index,
      stageLabel: meta.stageLabel,
      pipeline: meta.pipeline,
      telemetryBadge: meta.telemetryBadge,
      title: group.title,
      description: group.copy,
      skills: group.skills,
      ctaLabel: meta.ctaLabel,
      href: meta.href,
    };
  },
);

/* ============================================================================
   SCOPED PRECISION GLASS & MOTION STYLES
   Uses masked 1.25px specular borders, multi-stop ember corner luminescence,
   static /grain.svg noise overlay, and mobile-optimized backdrop blur.
   ============================================================================ */

const CAPABILITIES_STYLES = `
  .onycx-capabilities {
    --ember-hot: rgba(255, 118, 44, 0.92);
    --ember-mid: rgba(235, 84, 24, 0.56);
    --ember-deep: rgba(124, 38, 10, 0.28);
    --ember-rim: rgba(255, 214, 186, 0.74);
    --ember-rim-soft: rgba(255, 152, 92, 0.36);
    font-family: var(--font-geist-sans), Arial, sans-serif;
  }

  /* Subtle ambient studio glow behind the section — restrained & atmospheric */
  .onycx-ambient-aura {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
    z-index: 0;
  }

  .onycx-ambient-aura::before {
    content: "";
    position: absolute;
    top: 8%;
    left: 50%;
    transform: translateX(-50%);
    width: 82vw;
    max-width: 960px;
    height: 440px;
    border-radius: 9999px;
    background: radial-gradient(
      ellipse at center,
      rgba(242, 88, 34, 0.11) 0%,
      rgba(164, 58, 18, 0.05) 45%,
      transparent 74%
    );
    filter: blur(60px);
  }

  .onycx-ambient-aura::after {
    content: "";
    position: absolute;
    bottom: -12%;
    right: -6%;
    width: 58vw;
    max-width: 720px;
    height: 520px;
    border-radius: 9999px;
    background: radial-gradient(
      circle at center,
      rgba(255, 104, 36, 0.14) 0%,
      rgba(128, 42, 12, 0.06) 48%,
      transparent 75%
    );
    filter: blur(64px);
  }

  /* Core Frosted Obsidian Glass Card Chassis */
  .cap-glass-card {
    --mx: 50%;
    --my: 50%;
    position: relative;
    isolation: isolate;
    border-radius: 30px;
    background-color: rgba(11, 11, 13, 0.78);
    -webkit-backdrop-filter: blur(26px) saturate(130%);
    backdrop-filter: blur(26px) saturate(130%);
    overflow: hidden;
    box-shadow:
      0 26px 60px -18px rgba(0, 0, 0, 0.85),
      0 8px 24px -8px rgba(0, 0, 0, 0.6),
      inset 0 1px 0 0 rgba(255, 255, 255, 0.075);
    transition:
      transform 0.45s cubic-bezier(0.22, 1, 0.36, 1),
      box-shadow 0.45s cubic-bezier(0.22, 1, 0.36, 1);
  }

  /* Optical Internal Lighting: Top-left studio reflection + bottom-right ember bloom */
  .cap-glass-card__lighting {
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    border-radius: inherit;
    opacity: 0.78;
    background:
      radial-gradient(
        42% 30% at 96% 98%,
        var(--ember-hot) 0%,
        var(--ember-mid) 36%,
        transparent 76%
      ),
      radial-gradient(
        86% 36% at 68% 106%,
        var(--ember-mid) 0%,
        var(--ember-deep) 48%,
        transparent 84%
      ),
      radial-gradient(
        56% 40% at 4% 2%,
        rgba(255, 255, 255, 0.12) 0%,
        rgba(255, 255, 255, 0.035) 42%,
        transparent 74%
      );
    transition: opacity 0.45s ease;
  }

  /* Center card gets a subtly warmer default focal glow without breaking cohesion */
  .cap-glass-card--featured .cap-glass-card__lighting {
    opacity: 0.94;
  }

  /* Pointer-Tracked Frosted Specular Sheen */
  .cap-glass-card__sheen {
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
    border-radius: inherit;
    opacity: 0;
    background: radial-gradient(
      360px circle at var(--mx) var(--my),
      rgba(255, 255, 255, 0.06),
      transparent 60%
    );
    transition: opacity 0.35s ease;
  }

  /* Static Frosted Micro-Grain Texture (avoids per-card SVG filter rasterization) */
  .cap-glass-card__noise {
    position: absolute;
    inset: 0;
    z-index: 3;
    pointer-events: none;
    border-radius: inherit;
    background-image: url("/grain.svg");
    background-size: 160px 160px;
    opacity: 0.23;
    mix-blend-mode: overlay;
  }

  /* Masked 1.25px Specular Rim Border catching studio light & bottom-right ember glow */
  .cap-glass-card::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: 4;
    padding: 1.25px;
    border-radius: inherit;
    pointer-events: none;
    background:
      radial-gradient(
        56% 48% at 96% 97%,
        var(--ember-rim) 0%,
        var(--ember-rim-soft) 40%,
        transparent 74%
      ),
      linear-gradient(
        152deg,
        rgba(255, 255, 255, 0.28) 0%,
        rgba(255, 255, 255, 0.1) 30%,
        rgba(255, 255, 255, 0.04) 60%,
        rgba(255, 255, 255, 0.18) 100%
      );
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    mask-composite: exclude;
  }

  /* Recessed Obsidian Stage inside each card for cohesive discipline artifacts */
  .cap-visual-stage {
    position: relative;
    border-radius: 20px;
    background: linear-gradient(
      180deg,
      rgba(18, 18, 21, 0.88) 0%,
      rgba(9, 9, 11, 0.94) 100%
    );
    border: 1px solid rgba(255, 255, 255, 0.07);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.06),
      inset 0 -24px 40px -24px rgba(0, 0, 0, 0.8);
    overflow: hidden;
  }

  /* Subtle Architectural Micro-Grid inside the visual stage */
  .cap-visual-stage__grid {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-image:
      linear-gradient(to right, rgba(255, 255, 255, 0.032) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255, 255, 255, 0.032) 1px, transparent 1px);
    background-size: 26px 26px;
    -webkit-mask-image: radial-gradient(ellipse at 50% 45%, black 35%, transparent 86%);
    mask-image: radial-gradient(ellipse at 50% 45%, black 35%, transparent 86%);
  }

  /* Elevated Tactile Glass Medallion (Icon Container) */
  .cap-icon-medallion {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    flex-shrink: 0;
    border-radius: 9999px;
    background: linear-gradient(
      145deg,
      rgba(48, 48, 54, 0.85) 0%,
      rgba(20, 20, 23, 0.94) 55%,
      rgba(12, 12, 14, 0.98) 100%
    );
    box-shadow:
      0 10px 22px -6px rgba(0, 0, 0, 0.85),
      inset 0 1px 1px rgba(255, 255, 255, 0.2);
  }

  .cap-icon-medallion::before {
    content: "";
    position: absolute;
    inset: 0;
    padding: 1px;
    border-radius: inherit;
    pointer-events: none;
    background: linear-gradient(
      140deg,
      rgba(255, 255, 255, 0.34) 0%,
      rgba(255, 255, 255, 0.06) 50%,
      rgba(255, 255, 255, 0.02) 100%
    );
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    mask-composite: exclude;
  }

  /* Subtle kinetic transitions for SVG stage elements */
  .cap-glass-card .cap-bar-anim {
    transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s ease;
    transform-origin: bottom center;
  }

  .cap-glass-card .cap-orbit-ring {
    transition: transform 0.75s cubic-bezier(0.22, 1, 0.36, 1);
    transform-origin: center;
  }

  .cap-glass-card .cap-wave-group {
    transition: transform 0.65s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .cap-cta-arrow {
    transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), color 0.25s ease;
  }

  /* Signature Ember Pill Button */
  .onycx-ember-btn {
    position: relative;
    background: linear-gradient(135deg, #ff6330 0%, #ea4c1d 100%);
    box-shadow:
      0 10px 30px -8px rgba(255, 90, 38, 0.55),
      inset 0 1px 0 rgba(255, 255, 255, 0.32);
    transition:
      transform 0.3s cubic-bezier(0.22, 1, 0.36, 1),
      box-shadow 0.3s ease;
  }

  @media (hover: hover) and (pointer: fine) {
    .cap-glass-card:hover {
      transform: translateY(-5px);
      box-shadow:
        0 34px 72px -16px rgba(0, 0, 0, 0.9),
        0 12px 32px -10px rgba(255, 90, 34, 0.16),
        inset 0 1px 0 0 rgba(255, 255, 255, 0.12);
    }

    .cap-glass-card:hover .cap-glass-card__lighting {
      opacity: 1;
    }

    .cap-glass-card:hover .cap-glass-card__sheen {
      opacity: 1;
    }

    .cap-glass-card:hover .cap-bar-anim {
      transform: scaleY(1.06);
    }

    .cap-glass-card:hover .cap-orbit-ring {
      transform: rotate(18deg) scale(1.03);
    }

    .cap-glass-card:hover .cap-wave-group {
      transform: translateY(-3px);
    }

    .cap-glass-card:hover .cap-cta-arrow {
      transform: translate(2.5px, -2.5px);
    }

    .onycx-ember-btn:hover {
      transform: translateY(-2px);
      box-shadow:
        0 16px 38px -8px rgba(255, 96, 42, 0.72),
        inset 0 1px 0 rgba(255, 255, 255, 0.42);
    }

    .onycx-ember-btn:hover .onycx-ember-btn__arrow {
      transform: translate(2px, -2px);
    }
  }

  @media (hover: none) {
    .cap-glass-card__sheen {
      display: none;
    }
  }

  @media (max-width: 760px) {
    .onycx-ambient-aura::before {
      width: 96vw;
      height: 280px;
      filter: blur(34px);
    }

    .onycx-ambient-aura::after {
      width: 82vw;
      height: 320px;
      filter: blur(38px);
    }

    .cap-glass-card {
      border-radius: 24px;
      -webkit-backdrop-filter: blur(16px) saturate(118%);
      backdrop-filter: blur(16px) saturate(118%);
      box-shadow:
        0 18px 40px -14px rgba(0, 0, 0, 0.82),
        inset 0 1px 0 0 rgba(255, 255, 255, 0.075);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .cap-glass-card,
    .cap-glass-card__lighting,
    .cap-glass-card__sheen,
    .cap-bar-anim,
    .cap-orbit-ring,
    .cap-wave-group,
    .cap-cta-arrow,
    .onycx-ember-btn,
    .onycx-ember-btn__arrow {
      transition: none !important;
    }

    .cap-glass-card:hover,
    .onycx-ember-btn:hover {
      transform: none !important;
    }
  }
`;

/* ============================================================================
   BESPOKE DISCIPLINE VISUAL ARTIFACTS (COHESIVE DARK OBSIDIAN + EMBER SYSTEM)
   ============================================================================ */

function DataSignalStage({ uid }: { uid: string }) {
  const barGrad = `data-bar-${uid}`;
  const emberGrad = `data-ember-${uid}`;
  const lineGrad = `data-line-${uid}`;
  const bars = [
    { x: 24, h: 28, active: false },
    { x: 56, h: 46, active: false },
    { x: 88, h: 38, active: false },
    { x: 120, h: 62, active: false },
    { x: 152, h: 52, active: false },
    { x: 184, h: 76, active: false },
    { x: 216, h: 88, active: false },
    { x: 248, h: 112, active: true },
  ];

  return (
    <svg
      viewBox="0 0 300 162"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="relative z-10 h-full w-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={barGrad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.28)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.03)" />
        </linearGradient>
        <linearGradient id={emberGrad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff7a3d" />
          <stop offset="55%" stopColor="#f25422" />
          <stop offset="100%" stopColor="rgba(242,84,34,0.16)" />
        </linearGradient>
        <linearGradient
          id={lineGrad}
          x1="24"
          y1="0"
          x2="260"
          y2="0"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="rgba(255,132,74,0.25)" />
          <stop offset="70%" stopColor="#ff6b35" />
          <stop offset="100%" stopColor="#ffd2b8" />
        </linearGradient>
      </defs>

      {/* Soft ember glow behind the peak signal column */}
      <ellipse
        cx="256"
        cy="86"
        rx="46"
        ry="58"
        fill="rgba(255, 96, 38, 0.16)"
      />

      {/* Precision Baseline */}
      <line
        x1="18"
        y1="142"
        x2="282"
        y2="142"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="1"
      />

      {/* Translucent Glass Bars */}
      {bars.map((bar, idx) => (
        <g
          key={bar.x}
          className="cap-bar-anim"
          style={{ transitionDelay: `${idx * 25}ms` }}
        >
          <rect
            x={bar.x}
            y={142 - bar.h}
            width="16"
            height={bar.h}
            rx="5"
            fill={bar.active ? `url(#${emberGrad})` : `url(#${barGrad})`}
            stroke={
              bar.active
                ? "rgba(255, 188, 148, 0.45)"
                : "rgba(255, 255, 255, 0.08)"
            }
            strokeWidth="0.8"
          />
        </g>
      ))}

      {/* Smooth Signal Trendline */}
      <path
        d="M32 104 C 54 102, 62 78, 96 86 C 122 92, 134 62, 160 66 C 186 70, 198 44, 224 44 C 240 44, 246 31, 256 26"
        stroke={`url(#${lineGrad})`}
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* Focal Target Reticle at Peak */}
      <circle cx="256" cy="26" r="10" fill="rgba(255, 106, 48, 0.18)" />
      <circle
        cx="256"
        cy="26"
        r="5.5"
        fill="#0d0d0f"
        stroke="#ff7a3d"
        strokeWidth="1.6"
      />
      <circle cx="256" cy="26" r="2" fill="#ffd9c4" />
    </svg>
  );
}

function NeuralFieldStage({ uid }: { uid: string }) {
  const waveEmber = `ml-wave-${uid}`;
  const waveSilver = `ml-silver-${uid}`;
  const offsets = [-24, -18, -12, -6, 0, 6, 12, 18, 24];

  return (
    <svg
      viewBox="0 0 300 162"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="relative z-10 h-full w-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={waveEmber}
          x1="0"
          y1="81"
          x2="300"
          y2="81"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="rgba(255, 102, 42, 0.08)" />
          <stop offset="35%" stopColor="rgba(255, 114, 52, 0.65)" />
          <stop offset="50%" stopColor="rgba(255, 206, 174, 0.95)" />
          <stop offset="68%" stopColor="rgba(255, 102, 42, 0.65)" />
          <stop offset="100%" stopColor="rgba(255, 102, 42, 0.06)" />
        </linearGradient>
        <linearGradient
          id={waveSilver}
          x1="0"
          y1="81"
          x2="300"
          y2="81"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="rgba(255, 255, 255, 0.04)" />
          <stop offset="50%" stopColor="rgba(255, 255, 255, 0.22)" />
          <stop offset="100%" stopColor="rgba(255, 255, 255, 0.04)" />
        </linearGradient>
      </defs>

      {/* Atmospheric Center Inference Aura */}
      <ellipse
        cx="150"
        cy="82"
        rx="74"
        ry="46"
        fill="rgba(255, 92, 34, 0.16)"
      />

      {/* Converging Harmonic Wave Manifold */}
      <g className="cap-wave-group">
        {offsets.map((offset, idx) => {
          const isAccent = Math.abs(offset) <= 6;
          const startY = 82 + offset * 1.45;
          const ctrl1Y = 26 + offset * 1.1;
          const ctrl2Y = 136 + offset * 0.9;
          const endY = 82 - offset * 1.4;
          return (
            <path
              key={offset}
              d={`M -6 ${startY} C 68 ${ctrl1Y}, 110 82, 150 82 C 190 82, 232 ${ctrl2Y}, 306 ${endY}`}
              stroke={isAccent ? `url(#${waveEmber})` : `url(#${waveSilver})`}
              strokeWidth={isAccent ? "1.35" : "0.85"}
              opacity={isAccent ? 0.95 : 0.65 - idx * 0.02}
            />
          );
        })}
      </g>

      {/* Elevated Central Model Core Medallion with Signature Asterisk */}
      <circle
        cx="150"
        cy="82"
        r="27"
        fill="rgba(255, 96, 38, 0.12)"
        stroke="rgba(255, 130, 74, 0.25)"
        strokeWidth="1"
      />
      <circle
        cx="150"
        cy="82"
        r="20"
        fill="#0d0d10"
        stroke="rgba(255, 255, 255, 0.22)"
        strokeWidth="1.1"
      />
      <g stroke="#ff6c36" strokeWidth="2.1" strokeLinecap="round">
        <line x1="150" y1="73.5" x2="150" y2="90.5" />
        <line x1="142.6" y1="77.75" x2="157.4" y2="86.25" />
        <line x1="157.4" y1="77.75" x2="142.6" y2="86.25" />
      </g>
    </svg>
  );
}

function EngineeringSystemStage({ uid }: { uid: string }) {
  const ringGrad = `eng-ring-${uid}`;
  const cardGrad = `eng-card-${uid}`;

  return (
    <svg
      viewBox="0 0 300 162"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="relative z-10 h-full w-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={ringGrad}
          x1="190"
          y1="40"
          x2="270"
          y2="145"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#ff7c40" />
          <stop offset="65%" stopColor="rgba(255, 92, 34, 0.35)" />
          <stop offset="100%" stopColor="rgba(255, 255, 255, 0.08)" />
        </linearGradient>
        <linearGradient
          id={cardGrad}
          x1="34"
          y1="22"
          x2="256"
          y2="146"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="rgba(34, 34, 40, 0.92)" />
          <stop offset="100%" stopColor="rgba(14, 14, 17, 0.96)" />
        </linearGradient>
      </defs>

      {/* Subtle warm studio glow behind interface window */}
      <ellipse
        cx="228"
        cy="118"
        rx="60"
        ry="42"
        fill="rgba(255, 98, 38, 0.16)"
      />

      {/* Sleek Obsidian Glass Browser / Design System Frame */}
      <g>
        <rect
          x="32"
          y="22"
          width="236"
          height="120"
          rx="14"
          fill={`url(#${cardGrad})`}
          stroke="rgba(255, 255, 255, 0.14)"
          strokeWidth="1"
        />

        {/* Top Chrome Bar */}
        <line
          x1="32"
          y1="42"
          x2="268"
          y2="42"
          stroke="rgba(255, 255, 255, 0.07)"
          strokeWidth="1"
        />
        <circle cx="48" cy="32" r="2.6" fill="rgba(255,255,255,0.28)" />
        <circle cx="58" cy="32" r="2.6" fill="rgba(255,255,255,0.16)" />
        <circle cx="68" cy="32" r="2.6" fill="rgba(255,255,255,0.12)" />

        {/* Left Navigation Skeleton */}
        <rect x="46" y="56" width="32" height="3.5" rx="1.75" fill="#ff6b35" />
        <rect
          x="46"
          y="68"
          width="24"
          height="3"
          rx="1.5"
          fill="rgba(255,255,255,0.18)"
        />
        <rect
          x="46"
          y="78"
          width="28"
          height="3"
          rx="1.5"
          fill="rgba(255,255,255,0.14)"
        />
        <rect
          x="46"
          y="88"
          width="20"
          height="3"
          rx="1.5"
          fill="rgba(255,255,255,0.1)"
        />

        {/* Vertical Rail Divider */}
        <line
          x1="92"
          y1="42"
          x2="92"
          y2="142"
          stroke="rgba(255, 255, 255, 0.06)"
          strokeWidth="1"
        />

        {/* Editorial Headline & Copy Bars */}
        <rect
          x="108"
          y="56"
          width="44"
          height="3.5"
          rx="1.75"
          fill="rgba(255,255,255,0.22)"
        />
        <rect
          x="108"
          y="69"
          width="84"
          height="7"
          rx="3.5"
          fill="rgba(255,255,255,0.85)"
        />
        <rect
          x="108"
          y="82"
          width="64"
          height="4.5"
          rx="2.25"
          fill="rgba(255,255,255,0.24)"
        />

        {/* Signature Ember Interactive Pill inside the UI mockup */}
        <rect x="108" y="102" width="42" height="16" rx="8" fill="#f55827" />
        <path
          d="M126 112L131 107M131 107H127.2M131 107V110.8"
          stroke="#ffffff"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Concentric Kinetic Motion Arcs on Right */}
        <g
          className="cap-orbit-ring"
          style={{ transformOrigin: "238px 118px" }}
        >
          <circle
            cx="238"
            cy="118"
            r="44"
            stroke="rgba(255,255,255,0.14)"
            strokeWidth="1.2"
            strokeDasharray="60 22"
          />
          <circle
            cx="238"
            cy="118"
            r="30"
            stroke={`url(#${ringGrad})`}
            strokeWidth="2"
          />
          <circle
            cx="238"
            cy="118"
            r="16"
            stroke="rgba(255, 255, 255, 0.24)"
            strokeWidth="1.2"
          />
        </g>

        {/* Floating Tactile Dark-Glass Code Chip */}
        <g>
          <rect
            x="220"
            y="108"
            width="42"
            height="30"
            rx="9"
            fill="#141418"
            stroke="rgba(255, 255, 255, 0.22)"
            strokeWidth="1"
          />
          <path
            d="M235.5 119.5L232 123L235.5 126.5M246.5 119.5L250 123L246.5 126.5M242.5 118L239.5 128"
            stroke="#ff8a54"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </g>
    </svg>
  );
}

/* Discipline Icon Medallion SVGs */
function CapabilityIcon({
  id,
  gradientId,
}: {
  id: CapabilityItem["id"];
  gradientId: string;
}) {
  const strokeUrl = `url(#${gradientId})`;
  if (id === "data") {
    return (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M4 19V14M10 19V9M16 19V12M22 19V5"
          stroke={strokeUrl}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (id === "ml") {
    return (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="3" stroke={strokeUrl} strokeWidth="1.8" />
        <path
          d="M12 3V6M12 18V21M3 12H6M18 12H21M5.6 5.6L7.8 7.8M16.2 16.2L18.4 18.4M18.4 5.6L16.2 7.8M7.8 16.2L5.6 18.4"
          stroke={strokeUrl}
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8 9L4 12L8 15M16 9L20 12L16 15M13.5 6.5L10.5 17.5"
        stroke={strokeUrl}
        strokeWidth="1.85"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ============================================================================
   INDIVIDUAL REUSABLE CAPABILITY GLASS CARD
   ============================================================================ */

interface CapabilityCardProps {
  item: CapabilityItem;
  featured?: boolean;
  onNavigate?: (href: string, label: string) => void;
}

function CapabilityCard({
  item,
  featured = false,
  onNavigate,
}: CapabilityCardProps) {
  const cardRef = useRef<HTMLElement | null>(null);
  const rafRef = useRef<number | null>(null);

  // SSR-safe unique SVG ID per card instance
  const rawId = useId().replace(/:/g, "");
  const metalId = `cap-metal-${rawId}`;

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const handlePointerMove = useCallback((event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== "mouse") return;
    const node = cardRef.current;
    if (!node) return;

    const clientX = event.clientX;
    const clientY = event.clientY;

    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const rect = node.getBoundingClientRect();
      node.style.setProperty("--mx", `${(clientX - rect.left).toFixed(1)}px`);
      node.style.setProperty("--my", `${(clientY - rect.top).toFixed(1)}px`);
    });
  }, []);

  const handleLinkClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (onNavigate) {
      event.preventDefault();
      onNavigate(item.href, item.ctaLabel);
    }
  };

  return (
    <article
      ref={cardRef}
      onPointerMove={handlePointerMove}
      className={`cap-glass-card group flex h-full flex-col justify-between p-5 sm:p-7 ${
        featured ? "cap-glass-card--featured" : ""
      }`}
    >
      {/* Warm Metallic Gradient Definition for the Card Medallion Icon */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute h-0 w-0 overflow-hidden"
      >
        <defs>
          <linearGradient id={metalId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="55%" stopColor="#f9e6d8" />
            <stop offset="100%" stopColor="#df9c73" />
          </linearGradient>
        </defs>
      </svg>

      {/* Glass Optical Layers: Corner Bloom + Cursor Sheen + Micro-Grain */}
      <div className="cap-glass-card__lighting" aria-hidden="true" />
      <div className="cap-glass-card__sheen" aria-hidden="true" />
      <div className="cap-glass-card__noise" aria-hidden="true" />

      {/* Card Inner Content */}
      <div className="relative z-10 flex flex-1 flex-col">
        {/* Top Metadata Header: Medallion Icon + Index Pill */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="cap-icon-medallion">
              <CapabilityIcon id={item.id} gradientId={metalId} />
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-[10.5px] font-medium uppercase tracking-[0.16em] text-white/45">
                {item.index} / {item.stageLabel}
              </span>
              <span className="mt-0.5 font-mono text-[10px] tracking-[0.14em] text-[#ff7a45]/85">
                {item.pipeline[0]} → {item.pipeline[1]}
              </span>
            </div>
          </div>

          <span className="hidden rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 font-mono text-[9.5px] tracking-[0.12em] text-white/55 sm:inline-flex">
            {item.telemetryBadge}
          </span>
        </div>

        {/* Cohesive Dark-Glass Visual Artifact Stage */}
        <div className="cap-visual-stage mt-5 h-[160px] w-full sm:h-[178px]">
          <div className="cap-visual-stage__grid" aria-hidden="true" />
          {item.id === "data" && <DataSignalStage uid={rawId} />}
          {item.id === "ml" && <NeuralFieldStage uid={rawId} />}
          {item.id === "engineering" && <EngineeringSystemStage uid={rawId} />}
        </div>

        {/* Title & Editorial Copy */}
        <div className="mt-6 flex flex-1 flex-col">
          <h3 className="text-[23px] font-semibold leading-[1.18] tracking-[-0.03em] text-white sm:text-[27px]">
            {item.title}
          </h3>

          <p className="mt-3 text-[14.5px] leading-[1.6] tracking-[-0.006em] text-white/[0.66]">
            {item.description}
          </p>

          {/* Refined Translucent Glass Skill Pills */}
          <ul
            aria-label={`${item.title} technologies`}
            className="mt-6 flex flex-wrap gap-1.5"
          >
            {item.skills.map((skill) => (
              <li
                key={skill}
                className="rounded-full border border-white/[0.09] bg-white/[0.03] px-2.5 py-1 text-[11.5px] font-normal tracking-[-0.005em] text-white/75 transition-colors duration-200 group-hover:border-white/[0.14] group-hover:text-white/90"
              >
                {skill}
              </li>
            ))}
          </ul>
        </div>

        {/* Clean Divider + Full-Width Interactive Action Row */}
        <div className="mt-7 border-t border-white/[0.08] pt-3.5">
          <Link
            href={item.href}
            onClick={handleLinkClick}
            className="flex min-h-11 w-full items-center justify-between rounded-lg py-1.5 text-[14px] font-medium tracking-[-0.01em] text-white/85 transition-colors duration-200 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6a33]/50"
          >
            <span>{item.ctaLabel}</span>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-[#ff733b] transition-colors duration-200 group-hover:border-[#ff733b]/40 group-hover:bg-[#ff5a26]/15">
              <svg
                className="cap-cta-arrow h-3.5 w-3.5"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M4.5 11.5L11.5 4.5M11.5 4.5H5.75M11.5 4.5V10.25"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </Link>
        </div>
      </div>
    </article>
  );
}

/* ============================================================================
   MAIN SECTION & ERROR BOUNDARY
   ============================================================================ */

export function CapabilitiesSection({
  items = DEFAULT_CAPABILITIES,
  onNavigate,
  id = "capabilities",
}: CapabilitiesSectionProps) {
  const handleSeeWorkClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (onNavigate) {
      event.preventDefault();
      onNavigate("/projects", "See the work");
    }
  };

  return (
    <section
      id={id}
      aria-labelledby="capabilities-heading"
      className="portfolio-section portfolio-capabilities onycx-capabilities relative w-full overflow-x-clip bg-[#000] px-5 py-16 text-white antialiased selection:bg-[#ff5a26]/30 selection:text-white sm:px-8 sm:py-24 lg:px-12"
    >
      <style>{CAPABILITIES_STYLES}</style>

      {/* Atmospheric Background Lighting */}
      <div className="onycx-ambient-aura" aria-hidden="true" />

      <div className="relative z-10 mx-auto w-full max-w-[1440px]">
        {/* Top Editorial Section Bar */}
        <header
          data-reveal
          className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.09] pb-4"
        >
          <div className="flex items-center gap-2.5 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-white/60">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ff5a26]" />
            <span>03 / CAPABILITIES</span>
          </div>
          <p className="text-[12px] tracking-[-0.01em] text-white/50">
            Analytical thinking. Creative practice.
          </p>
        </header>

        {/* Hero Editorial Statement */}
        <div
          data-reveal
          className="mx-auto mt-12 max-w-3xl text-center sm:mt-20"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.09] bg-white/[0.03] px-3.5 py-1.5 backdrop-blur-md">
            <span
              className="h-1.5 w-1.5 rounded-full bg-[#ff5a26] shadow-[0_0_10px_#ff5a26]"
              aria-hidden="true"
            />
            <span className="text-[11.5px] font-medium tracking-[0.04em] text-white/75">
              A connected practice
            </span>
          </div>

          <h2
            id="capabilities-heading"
            className="mt-6 text-[34px] font-semibold leading-[1.06] tracking-[-0.04em] text-white sm:text-[54px] lg:text-[64px]"
          >
            <span className="block text-[#f5f5f7]">
              Understand the complex.
            </span>
            <span className="mt-1 inline-flex flex-wrap items-center justify-center gap-x-2.5 text-[#7e7e85] sm:gap-x-3">
              <span>Make it</span>
              <span
                className="inline-flex h-[0.68em] w-[0.68em] items-center justify-center text-[#ff5a26] drop-shadow-[0_0_20px_rgba(255,90,38,0.45)]"
                aria-hidden="true"
              >
                <svg viewBox="0 0 32 32" fill="none" className="h-full w-full">
                  <g
                    stroke="currentColor"
                    strokeWidth="3.6"
                    strokeLinecap="round"
                  >
                    <line x1="16" y1="3.5" x2="16" y2="28.5" />
                    <line x1="5.2" y1="9.75" x2="26.8" y2="22.25" />
                    <line x1="26.8" y1="9.75" x2="5.2" y2="22.25" />
                  </g>
                </svg>
              </span>
              <span>meaningful.</span>
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-xl text-[15px] leading-[1.65] tracking-[-0.008em] text-white/55 sm:text-[16.5px]">
            Finding the story in data. Exploring what models can do.
            <br className="hidden sm:inline" /> Bringing ideas to life through
            thoughtful interfaces.
          </p>
        </div>

        {/* 3-Column Obsidian Glass Capabilities Grid */}
        <div className="mt-12 grid grid-cols-1 gap-5 sm:mt-14 sm:gap-6 md:grid-cols-2 lg:mt-16 lg:grid-cols-3">
          {items.map((item, idx) => (
            <div key={item.id} data-reveal className="h-full">
              <CapabilityCard
                item={item}
                featured={idx === 1}
                onNavigate={onNavigate}
              />
            </div>
          ))}
        </div>

        {/* Bottom Editorial Closure Bar */}
        <footer
          data-reveal
          className="mt-12 flex flex-col items-start justify-between gap-6 border-t border-white/[0.09] pt-7 sm:mt-16 sm:flex-row sm:items-center"
        >
          <div>
            <p className="text-[15.5px] font-medium tracking-[-0.015em] text-white/95">
              Different disciplines.
            </p>
            <p className="mt-0.5 text-[14.5px] tracking-[-0.01em] text-white/45">
              The same curiosity.
            </p>
          </div>

          <Link
            href="/projects"
            onClick={handleSeeWorkClick}
            className="onycx-ember-btn inline-flex min-h-12 items-center gap-3.5 rounded-full py-2 pr-2 pl-5 text-[13.5px] font-medium tracking-[-0.01em] text-[#09090b] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7a45] focus-visible:ring-offset-2 focus-visible:ring-offset-[#000]"
          >
            <span className="font-semibold text-white">See the work</span>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#09090b] text-white">
              <svg
                className="onycx-ember-btn__arrow h-3.5 w-3.5 transition-transform duration-200"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M4.5 11.5L11.5 4.5M11.5 4.5H5.75M11.5 4.5V10.25"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </Link>
        </footer>
      </div>
    </section>
  );
}

interface BoundaryState {
  hasError: boolean;
}

class SectionErrorBoundary extends Component<
  { children: ReactNode },
  BoundaryState
> {
  state: BoundaryState = { hasError: false };

  static getDerivedStateFromError(): BoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("CapabilitiesSection render error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[320px] items-center justify-center bg-[#000] p-8 text-sm text-white/70">
          Unable to render Capabilities section.
        </div>
      );
    }
    return this.props.children;
  }
}

export default function Capabilities() {
  return (
    <SectionErrorBoundary>
      <CapabilitiesSection />
    </SectionErrorBoundary>
  );
}
