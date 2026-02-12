"use client";

import { useState, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import {
  GraduationCap,
  MapPin,
  Calendar,
  Zap,
  Code2,
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
    accentColor: "rgba(255,140,66,0.12)",
    glowColor: "rgba(255,140,66,0.08)",
  },
  {
    icon: BrainCircuit,
    title: "Machine Learning",
    desc: "Predictive models, deep learning, anomaly detection & intelligent data cleaning",
    accentColor: "rgba(34,211,238,0.12)",
    glowColor: "rgba(34,211,238,0.08)",
  },
  {
    icon: Palette,
    title: "Vibe Coding",
    desc: "Crafting beautiful, modern web experiences with AI-assisted development & creative flair",
    accentColor: "rgba(139,92,246,0.12)",
    glowColor: "rgba(139,92,246,0.08)",
  },
  {
    icon: Layers,
    title: "Data Visualization",
    desc: "Transforming complex datasets into clear, compelling visual stories that drive decisions",
    accentColor: "rgba(52,211,153,0.12)",
    glowColor: "rgba(52,211,153,0.08)",
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
 * AboutSection — Premium MagicUI BentoGrid layout with oversized Syne headlines,
 * dramatic gradient text, profile card, bio, strengths, stats, and education —
 * all designed to wow recruiters at first glance.
 */
export default function AboutSection() {
  return (
    <section
      id="about"
      className="relative py-36 md:py-52 px-4 md:px-8 overflow-hidden"
      aria-label="About"
    >
      {/* ── Ambient background glows ── */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute top-[5%] -left-[200px] w-[900px] h-[900px] rounded-full opacity-[0.05]"
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
        <div
          className="absolute top-[45%] left-[35%] w-[700px] h-[700px] rounded-full opacity-[0.03]"
          style={{
            background: "radial-gradient(circle, #8b5cf6, transparent 70%)",
            filter: "blur(120px)",
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

        {/* ── Massive Headline — Syne at gigantic size ── */}
        <RevealOnScroll delay={0.1}>
          <h2
            className="font-headline font-extrabold leading-[0.92] tracking-[-0.04em] mb-8 max-w-6xl"
            style={{
              fontSize: "clamp(3rem, 9vw, 7.5rem)",
            }}
          >
            <span className="text-white">I turn </span>
            <span
              style={{
                background:
                  "linear-gradient(135deg, #FF8C42 0%, #F59E42 40%, #22d3ee 100%)",
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
                background:
                  "linear-gradient(135deg, #22d3ee 0%, #8b5cf6 50%, #FF8C42 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              decisions
            </span>
            <span className="text-white/20">&nbsp;that</span>
            <br className="hidden lg:block" />
            <span className="text-white"> drive </span>
            <span className="text-white/20">impact.</span>
          </h2>
        </RevealOnScroll>

        {/* ── Subtitle ── */}
        <RevealOnScroll delay={0.2}>
          <p className="text-white/40 text-xl md:text-2xl lg:text-3xl max-w-4xl mb-24 md:mb-32 leading-relaxed font-light tracking-[-0.01em]">
            Computer Science graduate turning raw data into actionable
            insights with analytics, ML, and modern tools.
          </p>
        </RevealOnScroll>

        {/* ╔════════════════════════════════════════════════════════════════╗
            ║  BENTO GRID — MagicUI style                                    ║
            ╚════════════════════════════════════════════════════════════════╝ */}
        <RevealOnScroll delay={0.1}>
          <BentoGrid className="auto-rows-auto md:auto-rows-[22rem] md:grid-cols-3 gap-5 md:gap-6 mb-24 md:mb-32">
            {/* ── Card 1: Profile — large, spans 1 col ── */}
            <BentoCard
              name="Prashant Kumar Yadav"
              className="md:col-span-1 md:row-span-2"
              background={
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                  style={{
                    background:
                      "radial-gradient(ellipse at 30% 20%, rgba(255,140,66,0.08), transparent 60%)",
                  }}
                />
              }
            >
              <div className="relative z-10 flex flex-col items-center lg:items-start gap-6 p-8 md:p-10 h-full justify-center">
                {/* Profile Image */}
                <div className="relative">
                  <div className="relative w-44 h-44 md:w-56 md:h-56 rounded-2xl overflow-hidden">
                    <Image
                      src="/face.png"
                      alt="Prashant Kumar Yadav"
                      width={224}
                      height={224}
                      className="w-full h-full object-cover"
                      priority
                    />
                  </div>
                  <div
                    className="absolute -inset-6 rounded-2xl opacity-20 blur-3xl -z-10 group-hover:opacity-30 transition-opacity duration-700"
                    style={{
                      background:
                        "conic-gradient(from 180deg, #F59E42, #FF8C42, #22d3ee, #8b5cf6, #F59E42)",
                    }}
                  />
                </div>

                {/* Name & Title */}
                <div className="text-center lg:text-left">
                  <h3 className="font-headline font-bold text-2xl md:text-3xl text-white mb-2 tracking-[-0.02em]">
                    Prashant Kumar Yadav
                  </h3>
                  <p
                    className="font-semibold text-lg md:text-xl mb-3"
                    style={{
                      background: "linear-gradient(90deg, #FF8C42, #F59E42)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    Data Analyst &amp; Vibe Coder
                  </p>
                  <div className="flex items-center gap-2 text-white/35 text-sm justify-center lg:justify-start">
                    <MapPin size={16} />
                    <span className="font-medium">India</span>
                  </div>
                </div>

                {/* Tech pills */}
                <div className="flex flex-wrap gap-2 mt-1">
                  {["Python", "Power BI", "SQL", "Pandas", "ML"].map(
                    (tech) => (
                      <span
                        key={tech}
                        className="text-[11px] px-3.5 py-1.5 rounded-full text-white/55 font-semibold border border-white/[0.08] tracking-wide"
                        style={{ background: "rgba(255,255,255,0.04)" }}
                      >
                        {tech}
                      </span>
                    )
                  )}
                </div>
              </div>
            </BentoCard>

            {/* ── Card 2: Bio Story — spans 2 cols ── */}
            <BentoCard
              name="My Story"
              className="md:col-span-2 md:row-span-2"
              background={
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                  style={{
                    background:
                      "radial-gradient(ellipse at 70% 30%, rgba(34,211,238,0.05), transparent 60%)",
                  }}
                />
              }
            >
              <div className="relative z-10 flex flex-col justify-center h-full p-8 md:p-12">
                <span className="font-headline font-bold text-sm tracking-[0.25em] uppercase text-white/25 mb-8">
                  My Story
                </span>
                <div className="space-y-7">
                  <p className="text-white/50 text-lg md:text-xl lg:text-[1.45rem] leading-[1.85] font-light">
                    I specialize in data analytics, machine
                    learning, and AI-driven automation. I&apos;m passionate about transforming{" "}
                    <span className="text-white font-semibold">
                      raw data into actionable business insights
                    </span>{" "}
                    with clean pipelines, statistical analysis, and compelling visualizations.
                  </p>
                  <p className="text-white/50 text-lg md:text-xl lg:text-[1.45rem] leading-[1.85] font-light">
                    I thrive on building end-to-end data solutions that
                    solve real problems — from{" "}
                    <span className="text-white font-semibold">
                      interactive Power BI dashboards
                    </span>{" "}
                    for stakeholder decision-making to{" "}
                    <span className="text-white font-semibold">
                      AI-powered data cleaning tools
                    </span>
                    . As a vibe coder, I also love crafting{" "}
                    <span className="text-white font-semibold">
                      beautiful, modern web experiences
                    </span>
                    {" "}with creative flair and AI-assisted development.
                  </p>
                </div>
              </div>
            </BentoCard>

            {/* ── Cards 3-6: Strengths — each spans 1 col ── */}
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
                <div className="relative z-10 p-7 md:p-8 flex flex-col justify-end h-full">
                  <div
                    className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5"
                    style={{ background: s.accentColor }}
                  >
                    <s.icon size={26} className="text-white/90" />
                  </div>
                  <h4 className="font-headline font-bold text-white text-xl md:text-2xl mb-2 tracking-[-0.01em]">
                    {s.title}
                  </h4>
                  <p className="text-white/40 text-sm md:text-base leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </BentoCard>
            ))}

            {/* ── Card 7: Education — spans 2 cols ── */}
            <BentoCard
              name="Education"
              className="md:col-span-2"
              background={
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                  style={{
                    background:
                      "radial-gradient(ellipse at 20% 50%, rgba(255,140,66,0.05), transparent 60%)",
                  }}
                />
              }
            >
              <div className="relative z-10 flex items-start gap-6 p-8 md:p-10 h-full">
                <div
                  className="p-4 rounded-2xl shrink-0"
                  style={{ background: "rgba(255,140,66,0.1)" }}
                >
                  <GraduationCap size={28} className="text-accent-orange" />
                </div>
                <div className="flex-1">
                  <h3 className="font-headline font-bold text-2xl md:text-3xl text-white mb-2 tracking-[-0.01em]">
                    Chandigarh University
                  </h3>
                  <p
                    className="font-semibold text-base md:text-lg mb-3"
                    style={{
                      background: "linear-gradient(90deg, #F59E42, #FF8C42)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    B.E. Computer Science &amp; Technology
                  </p>
                  <div className="flex items-center gap-2.5 text-white/35 text-sm mb-5">
                    <Calendar size={14} />
                    <span className="font-medium">August 2021 — June 2025</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {["OOP", "DSA", "OS", "DBMS", "Networks", "IoT"].map(
                      (course) => (
                        <span
                          key={course}
                          className="text-[11px] px-3.5 py-1.5 rounded-full text-white/45 font-semibold border border-white/[0.07] tracking-wide"
                          style={{ background: "rgba(255,255,255,0.03)" }}
                        >
                          {course}
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>
            </BentoCard>

            {/* ── Card 8: Stats — spans 1 col ── */}
            <BentoCard
              name="Stats"
              className="md:col-span-1"
              background={
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background:
                      "radial-gradient(circle at 50% 50%, rgba(255,140,66,0.07), transparent 70%)",
                  }}
                />
              }
            >
              <div className="relative z-10 flex flex-col items-center justify-center h-full p-6 gap-6">
                {stats.map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div
                      className="font-headline font-extrabold"
                      style={{
                        fontSize: "clamp(2.5rem, 5vw, 4.5rem)",
                        lineHeight: "1",
                        background:
                          "linear-gradient(135deg, #FFFFFF 0%, #FF8C42 50%, #F59E42 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      <AnimatedCounter
                        target={stat.number}
                        suffix={stat.suffix}
                      />
                    </div>
                    <div className="text-white/35 text-[10px] md:text-xs font-bold tracking-[0.18em] uppercase font-headline mt-1">
                      {stat.label}
                    </div>
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
