"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Code2,
  BarChart3,
  BrainCircuit,
  Wrench,
} from "lucide-react";
import RevealOnScroll from "./RevealOnScroll";

/* ── Skill Categories (from Resume) ── */
interface SkillCategory {
  title: string;
  key: string;
  icon: React.ElementType;
  accentColor: string;
  glowColor: string;
  borderColor: string;
  skills: string[];
}

const skillCategories: SkillCategory[] = [
  {
    title: "Languages",
    key: "languages",
    icon: Code2,
    accentColor: "rgba(255,140,66,0.15)",
    glowColor: "rgba(255,140,66,0.06)",
    borderColor: "rgba(255,140,66,0.25)",
    skills: ["Python", "Java", "SQL"],
  },
  {
    title: "Data Analytics & BI",
    key: "analytics",
    icon: BarChart3,
    accentColor: "rgba(34,211,238,0.15)",
    glowColor: "rgba(34,211,238,0.06)",
    borderColor: "rgba(34,211,238,0.25)",
    skills: [
      "Power BI",
      "Pandas",
      "NumPy",
      "Statistical Analysis",
      "ETL",
      "Data Visualization",
    ],
  },
  {
    title: "ML & AI",
    key: "ml",
    icon: BrainCircuit,
    accentColor: "rgba(139,92,246,0.15)",
    glowColor: "rgba(139,92,246,0.06)",
    borderColor: "rgba(139,92,246,0.25)",
    skills: [
      "TensorFlow",
      "PyTorch",
      "Scikit-learn",
      "OpenCV",
      "PyOD",
      "Prompt Engineering",
    ],
  },
  {
    title: "Tools & Tech",
    key: "tools",
    icon: Wrench,
    accentColor: "rgba(52,211,153,0.15)",
    glowColor: "rgba(52,211,153,0.06)",
    borderColor: "rgba(52,211,153,0.25)",
    skills: [
      "Git",
      "React.js",
      "Data Cleaning",
      "Data Wrangling",
      "Business Intelligence",
      "SDLC",
    ],
  },
];

/* ── Marquee items ── */
const marqueeItems = [
  "Python",
  "SQL",
  "Power BI",
  "Pandas",
  "NumPy",
  "TensorFlow",
  "PyTorch",
  "Scikit-learn",
  "OpenCV",
  "Git",
  "React.js",
  "ETL",
  "Data Visualization",
  "Prompt Engineering",
  "PyOD",
  "Statistical Analysis",
];

/* ── Color map for tag hover glows ── */
const categoryGlowMap: Record<string, string> = {
  languages: "rgba(255,140,66,0.35)",
  analytics: "rgba(34,211,238,0.35)",
  ml: "rgba(139,92,246,0.35)",
  tools: "rgba(52,211,153,0.35)",
};

const categoryTextMap: Record<string, string> = {
  languages: "#FF8C42",
  analytics: "#22d3ee",
  ml: "#8b5cf6",
  tools: "#34d399",
};

export default function SkillsSection() {
  const [activeTab, setActiveTab] = useState("languages");
  const activeCat = skillCategories.find((c) => c.key === activeTab);

  return (
    <section
      id="skills"
      className="py-24 md:py-36 px-4 md:px-8 relative overflow-hidden"
      aria-label="Skills"
    >
      {/* Ambient background */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
      >
        <div
          className="absolute top-[10%] -left-[150px] w-[600px] h-[600px] rounded-full opacity-[0.04]"
          style={{
            background:
              "radial-gradient(circle, #FF8C42, transparent 70%)",
            filter: "blur(120px)",
          }}
        />
        <div
          className="absolute bottom-[10%] -right-[150px] w-[500px] h-[500px] rounded-full opacity-[0.03]"
          style={{
            background:
              "radial-gradient(circle, #8b5cf6, transparent 70%)",
            filter: "blur(100px)",
          }}
        />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <RevealOnScroll>
          <div className="text-center mb-4">
            <span className="inline-block text-xs font-bold tracking-[0.4em] uppercase text-accent-orange/70 mb-5">
              Expertise
            </span>
            <h2 className="font-headline font-bold text-section gradient-text-static mb-4">
              Skills & Expertise
            </h2>
            <p className="text-white/40 text-center mb-12 max-w-xl mx-auto text-lg">
              Technologies and tools I use to turn data into decisions.
            </p>
          </div>
        </RevealOnScroll>

        {/* Infinite Marquee */}
        <RevealOnScroll delay={0.1}>
          <div className="mb-16 overflow-hidden relative">
            <div
              className="absolute left-0 top-0 bottom-0 w-24 z-10"
              style={{
                background:
                  "linear-gradient(90deg, #000000, transparent)",
              }}
            />
            <div
              className="absolute right-0 top-0 bottom-0 w-24 z-10"
              style={{
                background:
                  "linear-gradient(270deg, #000000, transparent)",
              }}
            />
            <div className="flex animate-marquee gap-5 will-change-transform">
              {[...marqueeItems, ...marqueeItems].map((item, i) => (
                <span
                  key={i}
                  className="whitespace-nowrap text-sm font-semibold text-white/15 px-5 py-2.5 rounded-full shrink-0 tracking-wide"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </RevealOnScroll>

        {/* Category Tabs */}
        <RevealOnScroll delay={0.15}>
          <div className="flex justify-center gap-2 md:gap-3 mb-12 flex-wrap">
            {skillCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.key}
                  onClick={() => setActiveTab(cat.key)}
                  className={`relative text-sm font-semibold px-5 py-2.5 rounded-full transition-all duration-300 flex items-center gap-2 ${activeTab === cat.key
                    ? "text-white"
                    : "text-white/40 hover:text-white/60"
                    }`}
                >
                  {activeTab === cat.key && (
                    <motion.span
                      layoutId="skillTabBg"
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: cat.accentColor,
                        border: `1px solid ${cat.borderColor}`,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 350,
                        damping: 30,
                      }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Icon size={16} />
                    {cat.title}
                  </span>
                </button>
              );
            })}
          </div>
        </RevealOnScroll>

        {/* Skills Display */}
        <AnimatePresence mode="wait">
          {activeCat && (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Category Card */}
              <div
                className="relative rounded-3xl overflow-hidden p-8 md:p-12"
                style={{
                  background: activeCat.glowColor,
                  border: `1px solid ${activeCat.borderColor}`,
                  backdropFilter: "blur(20px)",
                }}
              >
                {/* Subtle inner glow */}
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[1px]"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${activeCat.borderColor}, transparent)`,
                  }}
                />
                <div
                  className="absolute inset-0 pointer-events-none opacity-30"
                  style={{
                    background: `radial-gradient(ellipse at 50% 0%, ${activeCat.glowColor}, transparent 60%)`,
                  }}
                />

                {/* Category header inside card */}
                <div className="relative z-10 flex items-center gap-4 mb-8">
                  <div
                    className="p-3.5 rounded-2xl"
                    style={{ background: activeCat.accentColor }}
                  >
                    <activeCat.icon
                      size={24}
                      style={{
                        color: categoryTextMap[activeCat.key],
                      }}
                    />
                  </div>
                  <div>
                    <h3 className="font-headline font-bold text-white text-xl md:text-2xl tracking-[-0.01em]">
                      {activeCat.title}
                    </h3>
                    <p className="text-white/30 text-sm mt-0.5">
                      {activeCat.skills.length} skills
                    </p>
                  </div>
                </div>

                {/* Skill Tags */}
                <div className="relative z-10 flex flex-wrap gap-3">
                  {activeCat.skills.map((skill, i) => (
                    <motion.div
                      key={skill}
                      initial={{ opacity: 0, scale: 0.8, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{
                        delay: i * 0.07,
                        duration: 0.5,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="group relative"
                    >
                      <div
                        className="relative px-6 py-3 rounded-2xl font-semibold text-sm md:text-base text-white/80
                          transition-all duration-300 cursor-default
                          hover:text-white hover:translate-y-[-2px]
                          hover:shadow-lg"
                        style={{
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.08)",
                        }}
                        onMouseEnter={(e) => {
                          const el = e.currentTarget;
                          el.style.borderColor = activeCat.borderColor;
                          el.style.boxShadow = `0 8px 32px ${categoryGlowMap[activeCat.key]}`;
                          el.style.background = activeCat.accentColor;
                        }}
                        onMouseLeave={(e) => {
                          const el = e.currentTarget;
                          el.style.borderColor =
                            "rgba(255,255,255,0.08)";
                          el.style.boxShadow = "none";
                          el.style.background =
                            "rgba(255,255,255,0.04)";
                        }}
                      >
                        {/* Shine effect */}
                        <div
                          className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none"
                          aria-hidden="true"
                        >
                          <div
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                            style={{
                              background: `linear-gradient(105deg, transparent 40%, ${activeCat.borderColor} 50%, transparent 60%)`,
                              backgroundSize: "200% 100%",
                              animation:
                                "shimmer 2s linear infinite",
                            }}
                          />
                        </div>
                        <span className="relative z-10">
                          {skill}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* All Skills overview — small tags below */}
              <div className="mt-8 flex flex-wrap justify-center gap-2">
                {skillCategories
                  .filter((c) => c.key !== activeTab)
                  .map((cat) =>
                    cat.skills.map((skill) => (
                      <span
                        key={`${cat.key}-${skill}`}
                        className="text-[11px] px-3 py-1.5 rounded-full text-white/20 font-medium tracking-wide transition-colors duration-300 hover:text-white/40"
                        style={{
                          background: "rgba(255,255,255,0.02)",
                          border:
                            "1px solid rgba(255,255,255,0.03)",
                        }}
                      >
                        {skill}
                      </span>
                    ))
                  )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
