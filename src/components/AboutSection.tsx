"use client";

import { useState, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import {
  GraduationCap,
  MapPin,
  Calendar,
  Layers,
  BrainCircuit,
  BarChart3,
  Palette,
} from "lucide-react";
import Image from "next/image";
import RevealOnScroll from "./RevealOnScroll";
import { BentoCard, BentoGrid } from "./ui/bento-grid";

/* ── Stats Data ── */
const stats = [
  { number: 4, suffix: "+", label: "Years Learning" },
  { number: 15, suffix: "+", label: "Projects Built" },
  { number: 10, suffix: "+", label: "Technologies" },
];

/* ── Core Strengths ── */
const strengths = [
  {
    icon: BarChart3,
    title: "Data Analytics",
    desc: "End-to-end data pipelines, ETL workflows, statistical analysis & Power BI dashboards",
    accentColor: "rgba(255,140,66,0.14)",
    glowColor: "rgba(255,140,66,0.10)",
    iconColor: "#FF8C42",
  },
  {
    icon: BrainCircuit,
    title: "Machine Learning",
    desc: "Predictive models, deep learning, anomaly detection & intelligent data cleaning",
    accentColor: "rgba(34,211,238,0.14)",
    glowColor: "rgba(34,211,238,0.10)",
    iconColor: "#22d3ee",
  },
  {
    icon: Palette,
    title: "Vibe Coding",
    desc: "Crafting beautiful, modern web experiences with AI-assisted development & creative flair",
    accentColor: "rgba(139,92,246,0.14)",
    glowColor: "rgba(139,92,246,0.10)",
    iconColor: "#8b5cf6",
  },
  {
    icon: Layers,
    title: "Data Visualization",
    desc: "Transforming complex datasets into clear, compelling visual stories that drive decisions",
    accentColor: "rgba(52,211,153,0.14)",
    glowColor: "rgba(52,211,153,0.10)",
    iconColor: "#34d399",
  },
];

/* ── Animated Counter ── */
function AnimatedCounter({
  target,
  suffix = "",
}: {
  target: number;
  suffix?: string;
}) {
  const [count, setCount] = useState(0);
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.5 });

  useEffect(() => {
    if (!inView) return;
    const duration = 1600;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [inView, target]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

/**
 * AboutSection — Premium BentoGrid layout with clean 2-column structure.
 * Row 1: Profile (1col) + Bio (2col)
 * Row 2: 4 Strengths (1col each, 4-col row with 3-col grid wrapping)
 * Row 3: Education (2col) + Stats (1col)
 */
export default function AboutSection() {
  return (
    <section
      id="about"
      className="relative py-28 md:py-40 px-4 md:px-8 overflow-hidden"
      aria-label="About"
    >
      {/* ── Ambient background glows ── */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute top-[5%] -left-[200px] w-[900px] h-[900px] rounded-full opacity-[0.06]"
          style={{
            background: "radial-gradient(circle, #FF8C42, transparent 70%)",
            filter: "blur(140px)",
          }}
        />
        <div
          className="absolute bottom-[10%] -right-[200px] w-[800px] h-[800px] rounded-full opacity-[0.04]"
          style={{
            background: "radial-gradient(circle, #22d3ee, transparent 70%)",
            filter: "blur(160px)",
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto">
        {/* ── Section Label ── */}
        <RevealOnScroll>
          <div className="flex items-center gap-5 mb-14">
            <span className="inline-block text-xs font-bold tracking-[0.4em] uppercase text-accent-orange/70">
              About
            </span>
            <div className="h-[1px] w-20 bg-gradient-to-r from-accent-orange/50 to-transparent" />
          </div>
        </RevealOnScroll>

        {/* ── Massive Headline ── */}
        <RevealOnScroll delay={0.1}>
          <h2
            className="font-headline font-extrabold leading-[0.92] tracking-[-0.04em] mb-8 max-w-6xl"
            style={{ fontSize: "clamp(2rem, 7vw, 7rem)" }}
          >
            <span className="text-white">I turn </span>
            <span
              style={{
                background: "linear-gradient(135deg, #FFB366 0%, #FF8C42 40%, #22d3ee 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              data into
            </span>
            <br className="hidden md:block" />
            <span
              style={{
                background: "linear-gradient(135deg, #22d3ee 0%, #8b5cf6 50%, #FF8C42 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              decisions
            </span>
            <span className="text-white/15">&nbsp;that</span>
            <br className="hidden lg:block" />
            <span className="text-white"> drive </span>
            <span className="text-white/15">impact.</span>
          </h2>
        </RevealOnScroll>

        {/* ── Subtitle ── */}
        <RevealOnScroll delay={0.2}>
          <p className="text-white/35 text-lg md:text-2xl max-w-4xl mb-20 md:mb-28 leading-relaxed font-light tracking-[-0.01em]">
            Computer Science graduate turning raw data into actionable
            insights with analytics, ML, and modern tools.
          </p>
        </RevealOnScroll>

        {/* ═══ BENTO GRID ═══ */}
        <RevealOnScroll delay={0.1}>
          <BentoGrid className="auto-rows-auto md:auto-rows-[24rem] md:grid-cols-3 gap-4 md:gap-5 mb-20 md:mb-28">

            {/* ── Card 1: Profile — 1 col, 2 row ── */}
            <BentoCard
              name="Prashant Kumar Yadav"
              className="md:col-span-1 md:row-span-2"
              background={
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                  style={{
                    background: "radial-gradient(ellipse at 30% 20%, rgba(255,140,66,0.10), transparent 60%)",
                  }}
                />
              }
            >
              <div className="relative z-10 flex flex-col items-center gap-5 p-6 md:p-8 h-full justify-center">
                {/* Profile Image */}
                <div className="relative">
                  <div className="relative w-44 h-44 sm:w-48 sm:h-48 md:w-52 md:h-52 rounded-2xl overflow-hidden ring-1 ring-white/10">
                    <Image
                      src="/pic.avif"
                      alt="Prashant Kumar Yadav"
                      width={208}
                      height={208}
                      className="w-full h-full object-cover object-top"
                      priority
                    />
                  </div>
                  <div
                    className="absolute -inset-4 rounded-2xl opacity-20 blur-2xl -z-10 group-hover:opacity-30 transition-opacity duration-700"
                    style={{
                      background: "conic-gradient(from 180deg, #F59E42, #FF8C42, #22d3ee, #8b5cf6, #F59E42)",
                    }}
                  />
                </div>

                {/* Name & Title */}
                <div className="text-center">
                  <h3 className="font-headline font-bold text-xl md:text-2xl text-white mb-1.5 tracking-[-0.02em]">
                    Prashant Kumar Yadav
                  </h3>
                  <p
                    className="font-semibold text-base md:text-lg mb-2"
                    style={{
                      background: "linear-gradient(90deg, #FFB366, #FF8C42, #E85D04)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    Data Analyst &amp; Vibe Coder
                  </p>
                  <div className="flex items-center gap-2 text-white/30 text-sm justify-center">
                    <MapPin size={14} />
                    <span className="font-medium">India</span>
                  </div>
                </div>

                {/* Tech pills */}
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {["Python", "Power BI", "SQL", "Pandas", "ML"].map((tech) => (
                    <span
                      key={tech}
                      className="text-[10px] px-3 py-1.5 rounded-full text-white/50 font-semibold border border-white/[0.07] tracking-wide transition-all duration-300 hover:border-accent-orange/30 hover:text-white/65"
                      style={{ background: "rgba(255,255,255,0.03)" }}
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </BentoCard>

            {/* ── Card 2: Bio Story — 2 cols, 1 row ── */}
            <BentoCard
              name="My Story"
              className="md:col-span-2 md:row-span-1"
              background={
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                  style={{
                    background: "radial-gradient(ellipse at 70% 30%, rgba(34,211,238,0.05), transparent 60%)",
                  }}
                />
              }
            >
              <div className="relative z-10 flex flex-col justify-center h-full p-6 md:p-10">
                <span className="font-headline font-bold text-xs tracking-[0.25em] uppercase text-white/20 mb-5">
                  My Story
                </span>
                <div className="space-y-5">
                  <p className="text-white/45 text-base md:text-lg leading-[1.8] font-light">
                    I specialize in data analytics, machine learning, and AI-driven automation. I&apos;m passionate about transforming{" "}
                    <span className="text-white font-semibold">raw data into actionable business insights</span>{" "}
                    with clean pipelines, statistical analysis, and compelling visualizations.
                  </p>
                  <p className="text-white/45 text-base md:text-lg leading-[1.8] font-light">
                    I thrive on building end-to-end data solutions — from{" "}
                    <span className="text-white font-semibold">interactive Power BI dashboards</span>{" "}
                    to{" "}
                    <span className="text-white font-semibold">AI-powered data cleaning tools</span>
                    . As a vibe coder, I also love crafting{" "}
                    <span className="text-white font-semibold">beautiful, modern web experiences</span>.
                  </p>
                </div>
              </div>
            </BentoCard>

            {/* ── Card 3: Education — 2 cols, 1 row ── */}
            <BentoCard
              name="Education"
              className="md:col-span-2 md:row-span-1"
              background={
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                  style={{
                    background: "radial-gradient(ellipse at 20% 50%, rgba(255,140,66,0.05), transparent 60%)",
                  }}
                />
              }
            >
              <div className="relative z-10 flex items-center gap-5 p-6 md:p-10 h-full">
                <div
                  className="p-3.5 rounded-xl shrink-0"
                  style={{ background: "rgba(255,140,66,0.10)" }}
                >
                  <GraduationCap size={26} className="text-accent-orange" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-headline font-bold text-xl md:text-2xl text-white mb-1 tracking-[-0.01em]">
                    Chandigarh University
                  </h3>
                  <p
                    className="font-semibold text-sm md:text-base mb-2"
                    style={{
                      background: "linear-gradient(90deg, #FFB366, #FF8C42)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    B.E. Computer Science &amp; Technology
                  </p>
                  <div className="flex items-center gap-2 text-white/30 text-xs mb-4">
                    <Calendar size={12} />
                    <span className="font-medium">August 2021 — June 2025</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {["OOP", "DSA", "OS", "DBMS", "Networks", "IoT"].map((course) => (
                      <span
                        key={course}
                        className="text-[10px] px-3 py-1.5 rounded-full text-white/35 font-semibold border border-white/[0.06] tracking-wide transition-all duration-300 hover:border-accent-orange/25 hover:text-white/55"
                        style={{ background: "rgba(255,255,255,0.03)" }}
                      >
                        {course}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </BentoCard>

            {/* ── Cards 4-7: Strengths — 1 col each ── */}
            {strengths.map((s) => (
              <BentoCard
                key={s.title}
                name={s.title}
                className="md:col-span-1"
                background={
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: `radial-gradient(circle at 50% 50%, ${s.glowColor}, transparent 70%)`,
                    }}
                  />
                }
              >
                <div className="relative z-10 p-6 md:p-8 flex flex-col justify-end h-full">
                  <div
                    className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4"
                    style={{ background: s.accentColor }}
                  >
                    <s.icon size={22} style={{ color: s.iconColor }} />
                  </div>
                  <h4 className="font-headline font-bold text-white text-lg md:text-xl mb-2 tracking-[-0.01em]">
                    {s.title}
                  </h4>
                  <p className="text-white/35 text-sm leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </BentoCard>
            ))}

            {/* ── Card 8: Stats — spans 2 cols ── */}
            <BentoCard
              name="Stats"
              className="md:col-span-2"
              background={
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: "radial-gradient(circle at 50% 50%, rgba(255,140,66,0.06), transparent 70%)",
                  }}
                />
              }
            >
              <div className="relative z-10 flex items-center justify-around h-full p-6 md:p-8">
                {stats.map((stat, i) => (
                  <div key={stat.label} className="text-center flex-1">
                    <div
                      className="font-headline font-extrabold mb-2"
                      style={{
                        fontSize: "clamp(2rem, 4vw, 4rem)",
                        lineHeight: "1",
                        background: "linear-gradient(135deg, #FFFFFF 0%, #FFB366 50%, #FF8C42 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      <AnimatedCounter target={stat.number} suffix={stat.suffix} />
                    </div>
                    <div className="text-white/30 text-[10px] md:text-xs font-bold tracking-[0.15em] uppercase font-headline">
                      {stat.label}
                    </div>
                    {/* Divider between stats */}
                    {i < stats.length - 1 && (
                      <div className="hidden" />
                    )}
                  </div>
                ))}
              </div>
            </BentoCard>
          </BentoGrid>
        </RevealOnScroll>
      </div>
    </section>
  );
}
