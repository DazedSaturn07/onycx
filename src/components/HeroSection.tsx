"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDown, Linkedin, Github, Mail, Sparkles } from "lucide-react";

const roles = [
  "Full-Stack Developer",
  "ML Engineer",
  "Data Analyst",
  "Problem Solver",
];

/**
 * HeroSection — Full viewport hero with kinetic word-level text reveal,
 * rotating roles, magnetic CTA buttons, morphing gradient mesh, and
 * an availability badge.
 */
export default function HeroSection() {
  const [roleIndex, setRoleIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cycle roles
  useEffect(() => {
    const interval = setInterval(() => {
      setRoleIndex((prev) => (prev + 1) % roles.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Word-stagger variants
  const nameWords = "Prashant Kumar Yadav".split(" ");
  const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];
  const containerVariants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.12, delayChildren: 0.4 },
    },
  };
  const wordVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease },
    },
  };

  return (
    <section
      id="home"
      ref={containerRef}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4 md:px-8"
      aria-label="Hero section"
    >
      {/* Morphing gradient mesh background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div
          className="absolute top-[5%] left-[5%] w-[300px] h-[300px] md:w-[600px] md:h-[600px] animate-morph animate-float"
          style={{
            background: "radial-gradient(circle, rgba(255,140,66,0.12) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        <div
          className="absolute top-[30%] right-[5%] w-[350px] h-[350px] md:w-[700px] md:h-[700px] animate-morph animate-float-alt"
          style={{
            background: "radial-gradient(circle, rgba(245,158,66,0.08) 0%, transparent 70%)",
            filter: "blur(100px)",
            animationDelay: "-3s",
          }}
        />
        <div
          className="absolute bottom-[5%] left-[30%] w-[250px] h-[250px] md:w-[500px] md:h-[500px] animate-morph animate-float-slow"
          style={{
            background: "radial-gradient(circle, rgba(34,211,238,0.06) 0%, transparent 70%)",
            filter: "blur(90px)",
            animationDelay: "-6s",
          }}
        />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center max-w-5xl mx-auto">
        {/* Availability Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-sm font-medium"
          style={{
            background: "rgba(255,140,66,0.08)",
            border: "1px solid rgba(255,140,66,0.2)",
          }}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
          </span>
          <span className="text-white/70">Available for opportunities</span>
        </motion.div>

        {/* Name — Word-level kinetic stagger */}
        <motion.h1
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="font-display font-bold text-hero mb-6"
          style={{ perspective: "1000px" }}
        >
          {nameWords.map((word, i) => (
            <motion.span
              key={i}
              variants={wordVariants}
              className="inline-block mr-[0.3em] gradient-text"
              style={{ transformOrigin: "center bottom" }}
            >
              {word}
            </motion.span>
          ))}
        </motion.h1>

        {/* Rotating Role Title */}
        <div className="h-12 md:h-14 mb-6 overflow-hidden flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.h2
              key={roleIndex}
              initial={{ y: 30, opacity: 0, filter: "blur(8px)" }}
              animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
              exit={{ y: -30, opacity: 0, filter: "blur(8px)" }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="font-display font-semibold text-2xl md:text-4xl text-white flex items-center gap-3"
            >
              <Sparkles size={20} className="text-accent-orange" />
              {roles[roleIndex]}
            </motion.h2>
          </AnimatePresence>
        </div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1, ease: [0.22, 1, 0.36, 1] }}
          className="text-white/50 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed"
        >
          Building intelligent, scalable web solutions with modern technologies.
          Turning complex problems into elegant, production-ready applications.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-14"
        >
          <a
            href="#projects"
            onClick={(e) => {
              e.preventDefault();
              document.querySelector("#projects")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="group relative px-8 py-4 rounded-full font-semibold text-white transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] hover:shadow-[0_0_40px_rgba(245,158,66,0.35)]"
            style={{
              background: "linear-gradient(135deg, #F59E42 0%, #FF8C42 100%)",
            }}
          >
            <span className="relative z-10 flex items-center gap-2">
              View Projects
              <svg
                className="w-4 h-4 transition-transform group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </a>
          <a
            href="#contact"
            onClick={(e) => {
              e.preventDefault();
              document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="px-8 py-4 rounded-full font-semibold text-white/80 border border-white/15 transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] hover:bg-white/5 hover:border-accent-orange/40 hover:text-white"
          >
            Get In Touch
          </a>
        </motion.div>

        {/* Social Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.5 }}
          className="flex gap-4 justify-center"
        >
          {[
            { icon: <Linkedin size={20} />, href: "https://linkedin.com/in/prashant-yadav", label: "LinkedIn" },
            { icon: <Github size={20} />, href: "https://github.com/DazedSaturn07", label: "GitHub" },
            { icon: <Mail size={20} />, href: "mailto:prashantyadav5735@gmail.com", label: "Email" },
          ].map((social) => (
            <a
              key={social.label}
              href={social.href}
              target={social.href.startsWith("http") ? "_blank" : undefined}
              rel={social.href.startsWith("http") ? "noopener noreferrer" : undefined}
              aria-label={social.label}
              className="p-3 rounded-full text-white/40 hover:text-accent-orange transition-all duration-300 hover:scale-110 hover:bg-white/5"
              style={{
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {social.icon}
            </a>
          ))}
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <a
          href="#about"
          onClick={(e) => {
            e.preventDefault();
            document.querySelector("#about")?.scrollIntoView({ behavior: "smooth" });
          }}
          aria-label="Scroll to about section"
          className="flex flex-col items-center gap-2 text-white/25 hover:text-accent-orange transition-colors"
        >
          <span className="text-[10px] tracking-[0.3em] uppercase font-medium">Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <ArrowDown size={16} />
          </motion.div>
        </a>
      </motion.div>
    </section>
  );
}
