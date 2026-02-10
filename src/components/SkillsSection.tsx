"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import RevealOnScroll from "./RevealOnScroll";

interface Skill {
  name: string;
  proficiency: number; // 0–100
}

interface SkillCategory {
  title: string;
  key: string;
  skills: Skill[];
}

const skillCategories: SkillCategory[] = [
  {
    title: "Frontend",
    key: "frontend",
    skills: [
      { name: "Next.js", proficiency: 90 },
      { name: "React.js", proficiency: 90 },
      { name: "TypeScript", proficiency: 85 },
      { name: "Tailwind CSS", proficiency: 92 },
      { name: "Framer Motion", proficiency: 80 },
      { name: "Redux / Zustand", proficiency: 78 },
    ],
  },
  {
    title: "Backend",
    key: "backend",
    skills: [
      { name: "Node.js", proficiency: 80 },
      { name: "Supabase", proficiency: 88 },
      { name: "PostgreSQL", proficiency: 82 },
      { name: "MySQL", proficiency: 78 },
      { name: "Django", proficiency: 65 },
      { name: "REST APIs", proficiency: 85 },
    ],
  },
  {
    title: "ML & Data",
    key: "ml",
    skills: [
      { name: "Python", proficiency: 88 },
      { name: "TensorFlow", proficiency: 72 },
      { name: "PyTorch", proficiency: 68 },
      { name: "OpenCV", proficiency: 70 },
      { name: "Pandas / NumPy", proficiency: 85 },
      { name: "Scikit-learn", proficiency: 78 },
      { name: "Power BI", proficiency: 82 },
    ],
  },
  {
    title: "Tools & Languages",
    key: "tools",
    skills: [
      { name: "Git / GitHub", proficiency: 88 },
      { name: "Vercel", proficiency: 85 },
      { name: "JavaScript", proficiency: 90 },
      { name: "Python", proficiency: 88 },
      { name: "SQL", proficiency: 82 },
      { name: "C/C++", proficiency: 70 },
      { name: "Java", proficiency: 65 },
    ],
  },
];

// Tech marquee display names
const marqueeItems = [
  "Next.js", "React", "TypeScript", "Tailwind CSS", "Node.js", "Supabase",
  "PostgreSQL", "Python", "TensorFlow", "PyTorch", "OpenCV", "Pandas",
  "Framer Motion", "Git", "Vercel", "Redis", "Power BI", "Scikit-learn",
];

export default function SkillsSection() {
  const [activeTab, setActiveTab] = useState("frontend");
  const activeCat = skillCategories.find((c) => c.key === activeTab);

  return (
    <section id="skills" className="py-24 md:py-36 px-4 md:px-8" aria-label="Skills">
      <div className="max-w-5xl mx-auto">
        <RevealOnScroll>
          <h2 className="font-display font-bold text-section gradient-text-static text-center mb-4">
            Skills & Tools
          </h2>
          <p className="text-white/40 text-center mb-12 max-w-xl mx-auto">
            Technologies I work with daily to build production applications.
          </p>
        </RevealOnScroll>

        {/* Infinite Marquee */}
        <RevealOnScroll delay={0.1}>
          <div className="mb-14 overflow-hidden relative">
            {/* Fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-24 z-10" style={{ background: "linear-gradient(90deg, #0b0f14, transparent)" }} />
            <div className="absolute right-0 top-0 bottom-0 w-24 z-10" style={{ background: "linear-gradient(270deg, #0b0f14, transparent)" }} />
            <div className="flex animate-marquee gap-6 will-change-transform">
              {[...marqueeItems, ...marqueeItems].map((item, i) => (
                <span
                  key={i}
                  className="whitespace-nowrap text-sm font-medium text-white/20 px-4 py-2 rounded-full shrink-0"
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
          <div className="flex justify-center gap-2 mb-10 flex-wrap">
            {skillCategories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveTab(cat.key)}
                className={`relative text-sm font-medium px-5 py-2 rounded-full transition-all duration-300 ${activeTab === cat.key
                    ? "text-white"
                    : "text-white/40 hover:text-white/60"
                  }`}
              >
                {activeTab === cat.key && (
                  <motion.span
                    layoutId="skillTab"
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: "rgba(255,140,66,0.12)",
                      border: "1px solid rgba(255,140,66,0.2)",
                    }}
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{cat.title}</span>
              </button>
            ))}
          </div>
        </RevealOnScroll>

        {/* Skill Pills Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            {activeCat?.skills.map((skill, i) => (
              <motion.div
                key={skill.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: i * 0.06,
                  duration: 0.5,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="glass p-4 flex items-center gap-4 group hover:translate-y-[-2px] transition-transform duration-300"
              >
                {/* Skill name */}
                <span className="text-sm font-semibold text-white/80 flex-shrink-0 min-w-[120px]">
                  {skill.name}
                </span>
                {/* Radial arc progress */}
                <div className="flex-1">
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${skill.proficiency}%` }}
                      transition={{
                        duration: 1,
                        delay: 0.2 + i * 0.06,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="h-full rounded-full"
                      style={{
                        background: `linear-gradient(90deg, #F59E42 0%, #FF8C42 ${skill.proficiency}%)`,
                      }}
                    />
                  </div>
                </div>
                {/* Percentage */}
                <span className="text-[11px] text-white/30 font-mono shrink-0 w-9 text-right">
                  {skill.proficiency}%
                </span>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
