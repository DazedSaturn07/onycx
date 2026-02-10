"use client";

import { useRef, useState, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { GraduationCap, Briefcase, Code, Layers, MapPin, Calendar } from "lucide-react";
import Image from "next/image";
import RevealOnScroll from "./RevealOnScroll";

const stats = [
  { icon: <Briefcase size={20} />, number: 4, suffix: "+", label: "Years Learning" },
  { icon: <Layers size={20} />, number: 15, suffix: "+", label: "Projects Built" },
  { icon: <Code size={20} />, number: 10, suffix: "+", label: "Technologies" },
];

/** Animated counter that counts up from 0 when in view */
function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.5 });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1500;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      start = Math.floor(eased * target);
      setCount(start);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [inView, target]);

  return <span ref={ref}>{count}{suffix}</span>;
}

/**
 * AboutSection — Bento grid layout with profile image, bio,
 * education timeline, and animated stat counters.
 */
export default function AboutSection() {
  const profileRef = useRef<HTMLDivElement>(null);

  return (
    <section id="about" className="py-24 md:py-36 px-4 md:px-8" aria-label="About">
      <div className="max-w-6xl mx-auto">
        <RevealOnScroll>
          <h2 className="font-display font-bold text-section gradient-text-static text-center mb-4">
            About Me
          </h2>
          <p className="text-white/40 text-center mb-16 max-w-xl mx-auto">
            Engineer. Builder. Thinker.
          </p>
        </RevealOnScroll>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5">
          {/* Profile Card — spans 5 cols */}
          <RevealOnScroll className="md:col-span-5" delay={0.1}>
            <div
              ref={profileRef}
              className="glass-heavy p-6 md:p-8 h-full flex flex-col items-center justify-center text-center group"
            >
              {/* Profile Image with gradient ring */}
              <div className="relative w-32 h-32 md:w-40 md:h-40 mb-6 rounded-full overflow-hidden">
                <div
                  className="absolute inset-0 rounded-full animate-pulse-glow"
                  style={{
                    background: "conic-gradient(from 0deg, #F59E42, #FF8C42, #22d3ee, #8b5cf6, #F59E42)",
                    padding: "3px",
                  }}
                >
                  <div className="w-full h-full rounded-full overflow-hidden bg-bg">
                    <Image
                      src="/face.png"
                      alt="Prashant Kumar Yadav"
                      width={160}
                      height={160}
                      className="w-full h-full object-cover"
                      priority
                    />
                  </div>
                </div>
              </div>
              <h3 className="font-display font-bold text-xl text-white mb-1">
                Prashant Kumar Yadav
              </h3>
              <p className="text-accent-orange font-medium text-sm mb-3">
                Full-Stack Developer & ML Engineer
              </p>
              <div className="flex items-center gap-2 text-white/40 text-sm">
                <MapPin size={14} />
                <span>India</span>
              </div>
            </div>
          </RevealOnScroll>

          {/* Bio Card — spans 7 cols */}
          <RevealOnScroll className="md:col-span-7" delay={0.2}>
            <div className="glass p-6 md:p-8 h-full">
              <h3 className="font-display font-semibold text-lg text-white mb-4">
                My Story
              </h3>
              <p className="text-white/55 leading-relaxed mb-5">
                Computer Science graduate specializing in full-stack web development,
                machine learning, and data analytics. I&apos;m passionate about creating
                performant, user-centric applications with clean architecture and
                modern tech stacks.
              </p>
              <p className="text-white/55 leading-relaxed">
                I thrive on building production-ready applications that solve real
                problems — from e-commerce platforms with secure payment processing
                to AI-powered data cleaning tools. My approach combines strong
                engineering fundamentals with a keen eye for user experience and
                scalable system design.
              </p>
            </div>
          </RevealOnScroll>

          {/* Education Card — spans 7 cols */}
          <RevealOnScroll className="md:col-span-7" delay={0.3}>
            <div className="glass p-6 md:p-8 h-full">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl shrink-0" style={{ background: "rgba(255,140,66,0.1)" }}>
                  <GraduationCap size={24} className="text-accent-orange" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display font-bold text-lg text-white mb-1">
                    Chandigarh University
                  </h3>
                  <p className="text-accent-warm font-medium text-sm mb-2">
                    B.E. Computer Science & Technology
                  </p>
                  <div className="flex items-center gap-2 text-white/40 text-xs mb-4">
                    <Calendar size={12} />
                    <span>August 2021 — June 2025</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {["OOP", "DSA", "OS", "DBMS", "Networks", "IoT"].map((course) => (
                      <span
                        key={course}
                        className="text-[11px] px-3 py-1 rounded-full text-white/50 font-medium"
                        style={{
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.06)",
                        }}
                      >
                        {course}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </RevealOnScroll>

          {/* Stats — spans 5 cols, grid of 3 */}
          <RevealOnScroll className="md:col-span-5" delay={0.4}>
            <div className="grid grid-cols-3 gap-3 h-full">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="glass p-4 text-center flex flex-col items-center justify-center hover:translate-y-[-3px] transition-transform duration-300 group"
                >
                  <div className="text-accent-orange mb-2 group-hover:scale-110 transition-transform">
                    {stat.icon}
                  </div>
                  <div className="text-2xl font-display font-bold text-accent-warm">
                    <AnimatedCounter target={stat.number} suffix={stat.suffix} />
                  </div>
                  <div className="text-[10px] text-white/40 mt-1 leading-tight">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
}
