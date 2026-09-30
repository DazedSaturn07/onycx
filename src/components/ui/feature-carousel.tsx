"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
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
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  analyticsProjects,
  machineLearningProjects,
  productProjects,
  type RepositoryProject,
} from "@/data/project-catalog";

const allProjects = [
  ...analyticsProjects,
  ...machineLearningProjects,
  ...productProjects,
];

const projectIcons = [
  Analytics01Icon,
  GlobalSearchIcon,
  Store01Icon,
  ChartLineData01Icon,
  FaceIdIcon,
  SourceCodeCircleIcon,
];

const cardGradients: Record<RepositoryProject["id"], string> = {
  "retail-iq": "linear-gradient(145deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
  shoplens: "linear-gradient(145deg, #091221 0%, #0c2b4a 50%, #1a5c6e 100%)",
  "customer-behaviour": "linear-gradient(145deg, #160a1f 0%, #3d154a 50%, #681f5c 100%)",
  "sales-analysis": "linear-gradient(145deg, #1c0e05 0%, #4a2107 50%, #7d370b 100%)",
  "face-mask-detection": "linear-gradient(145deg, #071512 0%, #123d33 50%, #1f6b57 100%)",
  reviewpilot: "linear-gradient(145deg, #050608 0%, #191f26 50%, #313d4a 100%)",
};

const FEATURES = allProjects.map((project, index) => ({
  id: project.id,
  label: project.title,
  icon: projectIcons[index % projectIcons.length] ?? DashboardSquare01Icon,
  description: project.summary,
  project,
  gradient: cardGradients[project.id],
}));

const AUTO_PLAY_INTERVAL = 3000;
const ITEM_HEIGHT = 65;

const wrap = (min: number, max: number, v: number) => {
  const rangeSize = max - min;
  return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min;
};

export function FeatureCarousel() {
  const [step, setStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

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
    if (isPaused) return;
    const interval = setInterval(nextStep, AUTO_PLAY_INTERVAL);
    return () => clearInterval(interval);
  }, [nextStep, isPaused]);

  const getCardStatus = (index: number) => {
    const diff = index - currentIndex;
    const len = FEATURES.length;

    let normalizedDiff = diff;
    if (diff > len / 2) normalizedDiff -= len;
    if (diff < -len / 2) normalizedDiff += len;

    return normalizedDiff;
  };

  return (
    <div
      role="region"
      aria-label="Featured projects"
      aria-roledescription="carousel"
      className="w-full max-w-7xl mx-auto md:p-8"
    >
      <div className="relative overflow-hidden rounded-[2.5rem] md:rounded-[3.5rem] flex flex-col md:flex-row min-h-[600px] border border-border/10 bg-background/50">
        <div className="w-full md:w-[45%] lg:w-[38%] min-h-[350px] md:min-h-[500px] relative z-30 flex flex-col items-start justify-center overflow-hidden px-6 md:px-12 lg:pl-16 bg-[#62B2FE] ">
          <div className="absolute inset-x-0 top-0 h-12 md:h-20 lg:h-16 bg-gradient-to-b from-[#62B2FE] via-[#62B2FE]/80 to-transparent z-40" />
          <div className="absolute inset-x-0 bottom-0 h-12 md:h-20 lg:h-16 bg-gradient-to-t from-[#62B2FE] via-[#62B2FE]/80 to-transparent z-40" />
          <div
            role="group"
            aria-label="Choose a project"
            className="relative z-20 flex h-full w-full items-center justify-center lg:justify-start"
          >
            {FEATURES.map((feature, index) => {
              const isActive = index === currentIndex;
              const distance = index - currentIndex;
              const wrappedDistance = wrap(
                -(FEATURES.length / 2),
                FEATURES.length / 2,
                distance
              );

              return (
                <motion.div
                  key={feature.id}
                  style={{
                    height: ITEM_HEIGHT,
                    width: "fit-content",
                  }}
                  animate={{
                    y: wrappedDistance * ITEM_HEIGHT,
                    opacity: 1 - Math.abs(wrappedDistance) * 0.25,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 90,
                    damping: 22,
                    mass: 1,
                  }}
                  className="absolute flex items-center justify-start"
                >
                  <button
                    type="button"
                    onClick={() => handleChipClick(index)}
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                    aria-pressed={isActive}
                    className={cn(
                      "relative flex items-center gap-3 px-4 py-3.5 text-left group rounded-full border transition-all duration-700 sm:gap-4 sm:px-6 md:px-10 md:py-5 lg:px-8 lg:py-4",
                      isActive
                        ? "bg-white text-[#62B2FE] border-white z-10"
                        : "bg-transparent text-white/60 border-white/20 hover:border-white/40 hover:text-white"
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-center justify-center transition-colors duration-500",
                        isActive ? "text-[#62B2FE]" : "text-white/40"
                      )}
                    >
                      <HugeiconsIcon
                        icon={feature.icon}
                        size={18}
                        strokeWidth={2}
                      />
                    </div>

                    <span className="whitespace-nowrap text-[13px] font-normal tracking-tight uppercase sm:text-sm md:text-[15px]">
                      {feature.label}
                    </span>
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 min-h-[500px] md:min-h-[600px] relative bg-secondary/30 flex items-center justify-center py-12 md:py-16 lg:py-16 px-4 md:px-10 lg:px-12 overflow-hidden border-t md:border-t-0 md:border-l border-border/20">
          <div className="relative w-full max-w-[650px] aspect-[3/4] sm:aspect-square md:aspect-[3/2] flex items-center justify-center">
            {FEATURES.map((feature, index) => {
              const diff = getCardStatus(index);
              const isActive = diff === 0;

              return (
                <motion.div
                  key={feature.id}
                  initial={false}
                  aria-hidden={!isActive}
                  animate={{
                    y: Math.abs(diff) * -25,
                    x: 0,
                    scale: 1 - Math.abs(diff) * 0.05,
                    opacity: 1 - Math.abs(diff) * 0.15,
                    rotate: 0,
                    zIndex: FEATURES.length - Math.abs(diff),
                    pointerEvents: isActive ? "auto" : "none",
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 25,
                    mass: 0.8,
                  }}
                  onMouseEnter={() => setIsPaused(true)}
                  onMouseLeave={() => setIsPaused(false)}
                  className="absolute inset-0 rounded-[2rem] md:rounded-[2.8rem] overflow-hidden border-4 md:border-8 border-background bg-background origin-center shadow-2xl"
                >
                  <div className="absolute inset-0" style={{ background: feature.gradient }} />

                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="pointer-events-none absolute inset-0 flex flex-col justify-end p-6 sm:p-8 md:p-10"
                      >
                        <div className="mb-4 w-fit rounded-full border border-white/20 bg-black/60 px-3 sm:px-4 py-1.5 text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.2em] text-white">
                          {index + 1} • {feature.label}
                        </div>
                        <p className="max-w-[100%] sm:max-w-[90%] text-lg sm:text-xl font-normal leading-relaxed tracking-tight text-white md:text-2xl lg:text-3xl">
                          {feature.description}
                        </p>
                        <div className="mt-6 md:mt-8 flex flex-wrap items-center justify-between gap-4">
                          <ul
                            className="flex flex-wrap gap-2"
                            aria-label={feature.project.title + " key technologies"}
                          >
                            {feature.project.technologies.slice(0, 3).map((technology) => (
                              <li
                                key={technology}
                                className="rounded-full border border-white/20 bg-black/60 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-white"
                              >
                                {technology}
                              </li>
                            ))}
                          </ul>
                          <Link
                            href={`/projects#${feature.project.id}`}
                            aria-label={`View ${feature.project.title} project details`}
                            onFocus={() => setIsPaused(true)}
                            onBlur={() => setIsPaused(false)}
                            className="pointer-events-auto inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full bg-white px-5 text-[11px] font-bold uppercase tracking-[0.14em] text-black transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                          >
                            View project
                            <ArrowUpRight size={16} aria-hidden="true" />
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div
                    className={cn(
                      "hidden md:flex absolute top-8 left-8 items-center gap-3 transition-opacity duration-300",
                      isActive ? "opacity-100" : "opacity-0"
                    )}
                  >
                    <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_10px_white]" />
                    <span className="text-white/80 text-[10px] font-normal uppercase tracking-[0.3em] font-mono">
                      {feature.project.category}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FeatureCarousel
