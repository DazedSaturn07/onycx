"use client";

import { useState, useEffect, useCallback, useRef, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import {
  motion,
  AnimatePresence,
  MotionConfig,
  useInView,
  useReducedMotion,
} from "motion/react";
import {
  Analytics01Icon,
  ChartLineData01Icon,
  DashboardSquare01Icon,
  FaceIdIcon,
  GlobalSearchIcon,
  SourceCodeCircleIcon,
  Store01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import GithubIcon from "@/components/ui/github-icon";
import { cn } from "@/lib/utils";
import {
  allRepositoryProjects,
  type RepositoryProject,
} from "@/data/project-catalog";

const allProjects = allRepositoryProjects;

const projectIcons: Record<string, typeof Analytics01Icon> = {
  "job-market": GlobalSearchIcon,
  loanflow: Analytics01Icon,
  airops: ChartLineData01Icon,
  "retail-iq": Store01Icon,
  shoplens: GlobalSearchIcon,
  "customer-behaviour": Analytics01Icon,
  novamart: ChartLineData01Icon,
  "face-mask-detection": FaceIdIcon,
  retainai: Analytics01Icon,
  reviewpilot: SourceCodeCircleIcon,
  civicpulse: GlobalSearchIcon,
  freightflow: ChartLineData01Icon,
  campaignlift: Analytics01Icon,
  mobilitydemand: ChartLineData01Icon,
};

interface CardGlassTheme {
  glowHot: string;
  glowMid: string;
  glowDeep: string;
  glowRim: string;
  glowRimSoft: string;
  iconColor: string;
}

const GLASS_PRESETS = {
  ember: {
    glowHot: "rgba(255, 146, 54, 0.88)",
    glowMid: "rgba(226, 102, 24, 0.62)",
    glowDeep: "rgba(124, 48, 13, 0.34)",
    glowRim: "rgba(255, 226, 198, 0.76)",
    glowRimSoft: "rgba(255, 192, 142, 0.40)",
    iconColor: "#f3c5a2",
  },
  cobalt: {
    glowHot: "rgba(74, 158, 255, 0.86)",
    glowMid: "rgba(36, 108, 232, 0.60)",
    glowDeep: "rgba(18, 52, 132, 0.34)",
    glowRim: "rgba(208, 232, 255, 0.76)",
    glowRimSoft: "rgba(140, 196, 255, 0.40)",
    iconColor: "#b8d7fc",
  },
  emerald: {
    glowHot: "rgba(58, 224, 152, 0.80)",
    glowMid: "rgba(24, 166, 108, 0.56)",
    glowDeep: "rgba(12, 82, 54, 0.32)",
    glowRim: "rgba(202, 255, 230, 0.74)",
    glowRimSoft: "rgba(126, 232, 184, 0.38)",
    iconColor: "#aee6cd",
  },
  amethyst: {
    glowHot: "rgba(157, 138, 242, 0.86)",
    glowMid: "rgba(104, 82, 214, 0.58)",
    glowDeep: "rgba(48, 34, 118, 0.34)",
    glowRim: "rgba(229, 224, 255, 0.76)",
    glowRimSoft: "rgba(176, 162, 250, 0.40)",
    iconColor: "#d3cafb",
  },
  cyan: {
    glowHot: "rgba(56, 210, 232, 0.82)",
    glowMid: "rgba(20, 132, 166, 0.56)",
    glowDeep: "rgba(10, 58, 82, 0.32)",
    glowRim: "rgba(204, 247, 255, 0.74)",
    glowRimSoft: "rgba(124, 224, 242, 0.38)",
    iconColor: "#b2eff8",
  },
  rose: {
    glowHot: "rgba(244, 114, 182, 0.82)",
    glowMid: "rgba(190, 52, 124, 0.56)",
    glowDeep: "rgba(84, 19, 54, 0.32)",
    glowRim: "rgba(255, 214, 237, 0.74)",
    glowRimSoft: "rgba(244, 148, 198, 0.38)",
    iconColor: "#fbc8e4",
  },
  obsidian: {
    glowHot: "rgba(226, 230, 240, 0.52)",
    glowMid: "rgba(164, 170, 184, 0.32)",
    glowDeep: "rgba(84, 88, 98, 0.22)",
    glowRim: "rgba(255, 255, 255, 0.68)",
    glowRimSoft: "rgba(220, 224, 234, 0.32)",
    iconColor: "#e4e7f0",
  },
} satisfies Record<string, CardGlassTheme>;

const cardThemes: Record<RepositoryProject["id"], CardGlassTheme> = {
  "job-market": GLASS_PRESETS.amethyst,
  loanflow: GLASS_PRESETS.emerald,
  airops: GLASS_PRESETS.cobalt,
  "retail-iq": GLASS_PRESETS.amethyst,
  shoplens: GLASS_PRESETS.cyan,
  "customer-behaviour": GLASS_PRESETS.rose,
  novamart: GLASS_PRESETS.ember,
  "face-mask-detection": GLASS_PRESETS.emerald,
  retainai: GLASS_PRESETS.cyan,
  civicpulse: GLASS_PRESETS.emerald,
  freightflow: GLASS_PRESETS.cobalt,
  campaignlift: GLASS_PRESETS.amethyst,
  mobilitydemand: GLASS_PRESETS.emerald,
  reviewpilot: GLASS_PRESETS.obsidian,
};

const FEATURES = allProjects.map((project) => ({
  id: project.id,
  label: project.title,
  icon: projectIcons[project.id] ?? DashboardSquare01Icon,
  description: project.summary,
  project,
  theme: cardThemes[project.id] ?? GLASS_PRESETS.amethyst,
}));

const AUTO_PLAY_INTERVAL = 3000;
const ITEM_HEIGHT = 65;

const wrap = (min: number, max: number, v: number) => {
  const rangeSize = max - min;
  return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min;
};

export function FeatureCarousel() {
  const region = useRef<HTMLDivElement>(null);
  const sheenRaf = useRef<number | null>(null);
  const inView = useInView(region, { amount: 0.15 });
  const reducedMotion = useReducedMotion();
  const [step, setStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [userPaused, setUserPaused] = useState(false);

  const currentIndex =
    ((step % FEATURES.length) + FEATURES.length) % FEATURES.length;

  const nextStep = useCallback(() => {
    setStep((prev) => prev + 1);
  }, []);

  const handleChipClick = (index: number) => {
    const diff = (index - currentIndex + FEATURES.length) % FEATURES.length;
    if (diff > 0) setStep((s) => s + diff);
  };

  useEffect(() => {
    return () => {
      if (sheenRaf.current !== null) cancelAnimationFrame(sheenRaf.current);
    };
  }, []);

  const handleCardPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.pointerType === "touch" || reducedMotion) return;
      const node = event.currentTarget;
      const clientX = event.clientX;
      const clientY = event.clientY;
      if (sheenRaf.current !== null) cancelAnimationFrame(sheenRaf.current);
      sheenRaf.current = requestAnimationFrame(() => {
        sheenRaf.current = null;
        const rect = node.getBoundingClientRect();
        node.style.setProperty("--mx", `${(clientX - rect.left).toFixed(1)}px`);
        node.style.setProperty("--my", `${(clientY - rect.top).toFixed(1)}px`);
      });
    },
    [reducedMotion],
  );

  useEffect(() => {
    if (isPaused || isFocused || userPaused || !inView || reducedMotion) return;
    const interval = setInterval(nextStep, AUTO_PLAY_INTERVAL);
    return () => clearInterval(interval);
  }, [nextStep, isPaused, isFocused, userPaused, inView, reducedMotion]);

  const getCardStatus = (index: number) => {
    const diff = index - currentIndex;
    const len = FEATURES.length;

    let normalizedDiff = diff;
    if (diff > len / 2) normalizedDiff -= len;
    if (diff < -len / 2) normalizedDiff += len;

    return normalizedDiff;
  };

  return (
    <MotionConfig reducedMotion="user">
      <div
        ref={region}
        onFocusCapture={() => setIsFocused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget))
            setIsFocused(false);
        }}
        role="region"
        aria-label="Featured projects"
        aria-roledescription="carousel"
        className="w-full max-w-7xl mx-auto md:p-8"
      >
        <div
          className="relative overflow-hidden rounded-[1.75rem] md:rounded-[3.5rem] flex flex-col md:flex-row min-h-[600px] border border-white/20 bg-[#0b0e17]/45 backdrop-blur-md md:backdrop-blur-xl backdrop-saturate-150"
          style={{
            boxShadow:
              "inset 0 1px 0 rgba(255, 255, 255, 0.24), inset 0 -1px 0 rgba(255, 255, 255, 0.06), 0 32px 80px rgba(4, 6, 12, 0.45)",
          }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-10"
            style={{
              background:
                "linear-gradient(130deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.02) 34%, transparent 64%, rgba(157,138,242,0.08) 100%)",
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-10 opacity-45 mix-blend-overlay"
            style={{
              backgroundImage: "url('/grain.svg')",
              backgroundSize: "160px 160px",
            }}
          />
          <div className="w-full md:w-[45%] lg:w-[38%] h-[250px] sm:h-[270px] md:h-auto md:min-h-[580px] relative z-30 flex flex-col overflow-hidden px-4 sm:px-6 md:px-12 lg:pl-16 pt-3 pb-16 bg-white/[0.03] md:border-r md:border-white/15">
            <div
              role="group"
              aria-label="Choose a project"
              className="relative z-20 flex flex-1 min-h-0 w-full items-center justify-center lg:justify-start"
              style={{
                WebkitMaskImage:
                  "linear-gradient(to bottom, transparent 0%, #000 20%, #000 80%, transparent 100%)",
                maskImage:
                  "linear-gradient(to bottom, transparent 0%, #000 20%, #000 80%, transparent 100%)",
              }}
            >
              {FEATURES.map((feature, index) => {
                const isActive = index === currentIndex;
                const distance = index - currentIndex;
                const wrappedDistance = wrap(
                  -(FEATURES.length / 2),
                  FEATURES.length / 2,
                  distance,
                );
                const chipVisible = Math.abs(wrappedDistance) <= 2.6;

                return (
                  <motion.div
                    key={feature.id}
                    style={{
                      height: ITEM_HEIGHT,
                      width: "fit-content",
                    }}
                    animate={{
                      y: wrappedDistance * ITEM_HEIGHT,
                      opacity: chipVisible ? Math.max(0, 1 - Math.abs(wrappedDistance) * 0.28) : 0,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 90,
                      damping: 22,
                      mass: 1,
                    }}
                    className={cn(
                      "absolute flex items-center justify-start",
                      !chipVisible && "pointer-events-none",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => handleChipClick(index)}
                      onMouseEnter={() => setIsPaused(true)}
                      onMouseLeave={() => setIsPaused(false)}
                      aria-pressed={isActive}
                      tabIndex={chipVisible ? 0 : -1}
                      className={cn(
                        "relative flex items-center gap-2.5 px-4 py-2.5 text-left group rounded-full border transition-colors duration-300 sm:gap-3.5 sm:px-5 sm:py-3 md:px-8 md:py-4",
                        isActive
                          ? "bg-white/95 text-[#0e1017] border-white shadow-[0_10px_28px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(255,255,255,0.9)] z-10"
                          : "bg-white/[0.06] text-white/75 border-white/15 hover:bg-white/[0.12] hover:border-white/30 hover:text-white",
                      )}
                    >
                      <div
                        className={cn(
                          "flex items-center justify-center transition-colors duration-300",
                          isActive ? "text-[#4c4287]" : "text-white/55",
                        )}
                      >
                        <HugeiconsIcon
                          icon={feature.icon}
                          size={18}
                          strokeWidth={2}
                        />
                      </div>

                      <span className="whitespace-nowrap text-xs font-normal tracking-tight uppercase sm:text-sm md:text-[15px]">
                        {feature.label}
                      </span>
                    </button>
                  </motion.div>
                );
              })}
            </div>
            <div className="absolute inset-x-4 bottom-3 md:bottom-4 z-50 flex items-center justify-center gap-2 rounded-full border border-white/15 bg-black/55 px-3 py-1 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]">
              <button
                type="button"
                aria-label="Previous featured project"
                onClick={() => setStep((s) => s - 1)}
                className="h-11 w-11 shrink-0 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
              >←</button>
              <span
                className="text-xs tabular-nums"
                aria-live={isFocused || userPaused ? "polite" : "off"}
              >{currentIndex + 1} / {FEATURES.length}</span>
              <button
                  type="button"
                  onClick={() => setUserPaused((p) => !p)}
                  aria-pressed={userPaused}
                  className="min-h-11 rounded-full px-3 text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                >{userPaused ? "Resume rotation" : "Pause rotation"}</button>
              <button
                type="button"
                aria-label="Next featured project"
                onClick={nextStep}
                className="h-11 w-11 shrink-0 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
              >→</button>
            </div>
          </div>

          <div className="flex-1 min-h-[450px] sm:min-h-[480px] md:min-h-[600px] relative z-20 flex items-center justify-center pt-10 pb-8 md:py-16 px-3.5 sm:px-6 md:px-10 lg:px-12 overflow-hidden border-t md:border-t-0 border-white/15">
            <div className="relative w-full max-w-[650px] min-h-[395px] sm:min-h-[420px] md:min-h-0 aspect-auto md:aspect-[3/2] flex items-center justify-center">
              {FEATURES.map((feature, index) => {
                const diff = getCardStatus(index);
                const absDiff = Math.abs(diff);
                const isActive = diff === 0;
                const isVisibleInStack = absDiff <= 2;

                return (
                  <motion.div
                    key={feature.id}
                    initial={false}
                    aria-hidden={!isActive}
                    data-stacked={!isActive ? "true" : undefined}
                    animate={{
                      y: absDiff * -20,
                      x: 0,
                      scale: 1 - absDiff * 0.05,
                      opacity: isVisibleInStack ? Math.max(0, 1 - absDiff * 0.3) : 0,
                      rotate: 0,
                      zIndex: FEATURES.length - absDiff,
                      pointerEvents: isActive ? "auto" : "none",
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 260,
                      damping: 25,
                      mass: 0.8,
                    }}
                    onPointerMove={isActive ? handleCardPointerMove : undefined}
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                    className={cn(
                      "glass-feature-card absolute inset-0 overflow-hidden origin-center",
                      !isVisibleInStack && "invisible",
                    )}
                    style={
                      {
                        "--glow-hot": feature.theme.glowHot,
                        "--glow-mid": feature.theme.glowMid,
                        "--glow-deep": feature.theme.glowDeep,
                        "--glow-rim": feature.theme.glowRim,
                        "--glow-rim-soft": feature.theme.glowRimSoft,
                      } as CSSProperties
                    }
                  >
                    <div className="glass-feature-card__lighting" aria-hidden="true" />
                    <div className="glass-feature-card__sheen" aria-hidden="true" />
                    <div className="glass-feature-card__noise" aria-hidden="true" />

                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          initial={{ opacity: 0, y: 14 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          className="pointer-events-none relative z-10 flex h-full flex-col justify-between p-5 sm:p-7 md:p-9"
                        >
                          {/* Top Row: Elevated Metallic Icon Medallion & Category Header */}
                          <div className="flex items-start justify-between gap-4">
                            <div
                              className="glass-icon-badge shrink-0"
                              aria-hidden="true"
                              style={{ color: feature.theme.iconColor }}
                            >
                              <HugeiconsIcon
                                icon={feature.icon}
                                size={24}
                                strokeWidth={1.8}
                              />
                            </div>
                            <div className="flex flex-col items-end gap-1 pt-1 text-right">
                              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/55">
                                {String(index + 1).padStart(2, "0")} / {String(FEATURES.length).padStart(2, "0")}
                              </span>
                              <span className="max-w-[180px] sm:max-w-none font-mono text-[10px] uppercase tracking-[0.2em] text-white/80">
                                {feature.project.category}
                              </span>
                            </div>
                          </div>

                          {/* Center Body: Bold Headline & Clamped Copy */}
                          <div className="my-auto py-3 sm:py-4">
                            <h3 className="text-[24px] font-semibold leading-[1.13] tracking-[-0.03em] text-white sm:text-[30px] md:text-[34px]">
                              {feature.label}
                            </h3>
                            <p className="mt-2.5 sm:mt-3 line-clamp-3 max-w-[96%] text-[14px] font-normal leading-[1.56] tracking-[-0.006em] text-white/[0.78] sm:text-[15.5px]">
                              {feature.description}
                            </p>
                          </div>

                          {/* Footer: Tech Pills & Action CTA */}
                          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3.5 sm:pt-4">
                            <ul
                              className="flex flex-wrap gap-1.5 sm:gap-2"
                              aria-label={
                                feature.project.title + " key technologies"
                              }
                            >
                              {feature.project.technologies
                                .slice(0, 3)
                                .map((technology) => (
                                  <li
                                    key={technology}
                                    className="rounded-full border border-white/15 bg-white/[0.06] px-2.5 sm:px-3 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-white/85"
                                  >
                                    {technology}
                                  </li>
                                ))}
                            </ul>
                            <div className="flex items-center gap-2.5">
                              <a
                                href={feature.project.repoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`Open ${feature.project.title} GitHub repository`}
                                onFocus={() => setIsPaused(true)}
                                onBlur={() => setIsPaused(false)}
                                className="pointer-events-auto inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-black/45 text-white/90 transition-colors hover:bg-white/15 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                              >
                                <GithubIcon size={19} />
                              </a>
                              <Link
                                href={`/projects#${feature.project.id}`}
                                aria-label={`View ${feature.project.title} project details`}
                                onFocus={() => setIsPaused(true)}
                                onBlur={() => setIsPaused(false)}
                                className="glass-card-cta pointer-events-auto inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full bg-white/95 px-4 sm:px-5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0e1017] shadow-[0_8px_22px_rgba(0,0,0,0.35)] transition-transform hover:bg-white hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                              >
                                <span>View project</span>
                                <ChevronRight className="glass-card-cta__chevron h-4 w-4" aria-hidden="true" />
                              </Link>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}

export default FeatureCarousel;
