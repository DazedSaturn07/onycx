"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDown, Linkedin, Github, Mail, Sparkles } from "lucide-react";
import { usePreload } from "@/context/PreloadContext";

/* ── Scroll Frame Animation Config ── */
const TOTAL_FRAMES = 192;
const FRAME_PATH = "/output_frames/frame_";

function padFrame(n: number): string {
  return String(n).padStart(5, "0");
}

/* ── Roles ── */
const roles = [
  "Data Analyst",
  "Vibe Coder",
  "ML Enthusiast",
  "Problem Solver",
];

/**
 * HeroSection — Full viewport hero with a scroll-scrubbed head-turn
 * animation as background. Uses a continuous rAF loop with frame
 * interpolation (lerp) for buttery smooth playback.
 */
export default function HeroSection() {
  const [roleIndex, setRoleIndex] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const loadedRef = useRef<Set<number>>(new Set());
  const currentFrameRef = useRef(0);
  const targetFrameRef = useRef(0);
  const rafRef = useRef(0);
  const lastDrawnFrameRef = useRef(-1);

  const { registerAsset, markLoaded } = usePreload();

  // ── Role Cycling ──
  useEffect(() => {
    const interval = setInterval(() => {
      setRoleIndex((prev) => (prev + 1) % roles.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // ── Draw a frame to canvas ──
  const drawFrame = useCallback((index: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const roundedIndex = Math.round(index);
    if (roundedIndex === lastDrawnFrameRef.current) return;

    // Find the closest loaded frame
    let targetIndex = roundedIndex;
    if (!loadedRef.current.has(roundedIndex)) {
      for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
        if (loadedRef.current.has(roundedIndex - offset)) {
          targetIndex = roundedIndex - offset;
          break;
        }
        if (loadedRef.current.has(roundedIndex + offset)) {
          targetIndex = roundedIndex + offset;
          break;
        }
      }
    }

    const img = imagesRef.current[targetIndex];
    if (!img || !loadedRef.current.has(targetIndex)) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const isMobile = window.innerWidth < 768;
    const dpr = isMobile ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
    const displayW = canvas.clientWidth;
    const displayH = canvas.clientHeight;

    if (canvas.width !== Math.round(displayW * dpr) || canvas.height !== Math.round(displayH * dpr)) {
      canvas.width = Math.round(displayW * dpr);
      canvas.height = Math.round(displayH * dpr);
      ctx.scale(dpr, dpr);
    }

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, displayW, displayH);

    // Cover-fit the image
    const imgAspect = img.naturalWidth / img.naturalHeight;
    const canvasAspect = displayW / displayH;
    let drawW: number, drawH: number, dx: number, dy: number;

    if (imgAspect > canvasAspect) {
      drawH = displayH;
      drawW = displayH * imgAspect;
      dx = Math.round((displayW - drawW) / 2);
      dy = 0;
    } else {
      drawW = displayW;
      drawH = displayW / imgAspect;
      dx = 0;
      dy = Math.round((displayH - drawH) / 2);
    }

    ctx.drawImage(img, dx, dy, Math.round(drawW), Math.round(drawH));
    lastDrawnFrameRef.current = roundedIndex;
  }, []);

  // ── Compute target frame index from scroll position ──
  const getFrameIndex = useCallback(() => {
    const section = sectionRef.current;
    if (!section) return 0;

    const scrollY = window.scrollY || window.pageYOffset;
    const sectionTop = section.offsetTop;
    const sectionHeight = section.offsetHeight;
    const viewportHeight = window.innerHeight;

    // Mobile: section height is smaller, so we need to map the scroll distance differently
    // to ensure we play through the whole sequence if possible, or just a part of it.
    // However, drawing 192 frames on a 200vh scroll is too fast. 
    // We should probably limit the frame range on mobile or just let it spin fast.
    const scrollDistance = sectionHeight - viewportHeight;
    if (scrollDistance <= 0) return 0;

    const scrolledInSection = scrollY - sectionTop;
    const progress = Math.max(0, Math.min(1, scrolledInSection / scrollDistance));

    return Math.min(progress * (TOTAL_FRAMES - 1), TOTAL_FRAMES - 1);
  }, []);

  // ── Preload all frames with priority loading ──
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    const images: HTMLImageElement[] = new Array(TOTAL_FRAMES);

    // Register assets
    for (let i = 0; i < TOTAL_FRAMES; i++) {
      // On mobile, maybe we only load every 2nd frame to save memory? 
      // But for smooth lerp we need them. Let's keep loading but prioritize better.
      registerAsset(`hero-frame-${i}`);
    }

    const loadFrame = (i: number) => {
      const img = new window.Image();
      img.decoding = "async";
      img.onload = () => {
        loadedRef.current.add(i);
        markLoaded(`hero-frame-${i}`);
        // Draw frame 0 immediately
        if (i === 0) drawFrame(0);
      };
      img.src = `${FRAME_PATH}${padFrame(i)}.webp`;
      images[i] = img;
    };

    // Priority: load key frames first
    const keyFrames: number[] = [];
    // On mobile, load fewer keyframes initially to unblock UI faster
    const step = isMobile ? 24 : 12;
    for (let i = 0; i < TOTAL_FRAMES; i += step) keyFrames.push(i);
    keyFrames.forEach(loadFrame);

    // Then load all remaining frames
    // On mobile, we might want to delay this further or do it in smaller chunks
    setTimeout(() => {
      for (let i = 0; i < TOTAL_FRAMES; i++) {
        if (i % step !== 0) loadFrame(i);
      }
    }, 1000);

    imagesRef.current = images;

    return () => {
      images.forEach((img) => {
        if (img) img.onload = null;
      });
    };
  }, [drawFrame, registerAsset, markLoaded]);

  // ── Continuous rAF loop with lerp + visibility-based pausing ──
  // When hero scrolls out of view, pause rAF to free GPU for LightPillar
  useEffect(() => {
    let isVisible = true;
    const isMobile = window.innerWidth < 768;

    const handleScroll = () => {
      targetFrameRef.current = getFrameIndex();
      // Check if hero is visible (with 200px buffer)
      if (sectionRef.current) {
        const rect = sectionRef.current.getBoundingClientRect();
        isVisible = rect.bottom > -200;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial

    const animate = () => {
      // Skip canvas work entirely when hero is offscreen
      if (isVisible) {
        const current = currentFrameRef.current;
        const target = targetFrameRef.current;
        const diff = target - current;

        // On mobile, aggressive lerp to catch up faster and avoid "lag" feel
        // or smoother lerp? If it lags, maybe snap faster.
        const lerpFactor = isMobile ? 0.2 : 0.15;
        // Stop updating if close enough to save battery/perf
        const threshold = isMobile ? 0.5 : 0.1;

        if (Math.abs(diff) > threshold) {
          currentFrameRef.current = current + diff * lerpFactor;
          drawFrame(currentFrameRef.current);
        } else if (Math.abs(diff) > 0.01) {
          currentFrameRef.current = target;
          drawFrame(target);
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [drawFrame, getFrameIndex]);

  // ── Resize → Redraw ──
  useEffect(() => {
    const handleResize = () => {
      lastDrawnFrameRef.current = -1; // Force redraw
      drawFrame(currentFrameRef.current);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [drawFrame]);

  // ── Framer-motion variants ──
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
      ref={sectionRef}
      className="relative w-full h-[200vh] md:h-[400vh]"
      aria-label="Hero section"
    >
      {/* Sticky viewport container — canvas BG + content overlay */}
      <div className="sticky top-0 w-full h-screen overflow-hidden">
        {/* ── Canvas background (z-0) ── */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full block"
          style={{
            willChange: "transform",
            transform: "translateZ(0)",
            imageRendering: "auto",
          }}
          aria-hidden="true"
        />

        {/* ── Dark overlay + vignette (z-1) ── */}
        <div
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse at center, transparent 30%, #000000 80%),
              linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.5) 100%)
            `,
          }}
        />

        {/* ── Morphing gradient mesh (z-2) ── */}
        <div
          className="absolute inset-0 z-[2] overflow-hidden pointer-events-none"
          aria-hidden="true"
        >
          <div className="absolute top-[5%] left-[5%] w-[300px] h-[300px] md:w-[600px] md:h-[600px] animate-float">
            <div
              className="w-full h-full animate-morph"
              style={{
                background:
                  "radial-gradient(circle, rgba(255,140,66,0.1) 0%, transparent 70%)",
                filter: "blur(80px)",
              }}
            />
          </div>
          <div
            className="absolute top-[30%] right-[5%] w-[350px] h-[350px] md:w-[700px] md:h-[700px] animate-float-alt"
            style={{ animationDelay: "-3s" }}
          >
            <div
              className="w-full h-full animate-morph"
              style={{
                background:
                  "radial-gradient(circle, rgba(245,158,66,0.07) 0%, transparent 70%)",
                filter: "blur(100px)",
                animationDelay: "-3s",
              }}
            />
          </div>
          <div
            className="absolute bottom-[5%] left-[30%] w-[250px] h-[250px] md:w-[500px] md:h-[500px] animate-float-slow"
            style={{ animationDelay: "-6s" }}
          >
            <div
              className="w-full h-full animate-morph"
              style={{
                background:
                  "radial-gradient(circle, rgba(34,211,238,0.05) 0%, transparent 70%)",
                filter: "blur(90px)",
                animationDelay: "-6s",
              }}
            />
          </div>
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

        {/* ── Hero Content (z-10) ── */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 md:px-8">
          <div className="text-center max-w-5xl mx-auto">

            {/* Name — Word-level kinetic stagger */}
            <motion.h1
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="font-display font-bold text-hero mb-6 break-words px-2"
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
                  transition={{
                    duration: 0.5,
                    ease: [0.22, 1, 0.36, 1],
                  }}
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
              transition={{
                duration: 0.8,
                delay: 1,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="text-white/45 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed"
            >
              Transforming raw data into actionable business insights
              with Python, SQL & Power BI. Building intelligent,
              AI-driven data solutions that drive decisions.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.8,
                delay: 1.2,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-14"
            >
              <a
                href="#projects"
                onClick={(e) => {
                  e.preventDefault();
                  document
                    .querySelector("#projects")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                className="group relative px-8 py-4 rounded-full font-semibold text-white transition-all duration-500 hover:scale-[1.03] active:scale-[0.98] hover:shadow-[0_0_50px_rgba(245,158,66,0.4)]"
                style={{
                  background:
                    "linear-gradient(135deg, #F59E42 0%, #FF8C42 50%, #E85D04 100%)",
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
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </span>
              </a>
              <a
                href="#contact"
                onClick={(e) => {
                  e.preventDefault();
                  document
                    .querySelector("#contact")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                className="px-8 py-4 rounded-full font-semibold text-white/80 border border-white/15 transition-all duration-500 hover:scale-[1.03] active:scale-[0.98] hover:bg-white/5 hover:border-accent-orange/40 hover:text-white"
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
                {
                  icon: <Linkedin size={20} />,
                  href: "https://linkedin.com/in/onycx",
                  label: "LinkedIn",
                },
                {
                  icon: <Github size={20} />,
                  href: "https://github.com/DazedSaturn07",
                  label: "GitHub",
                },
                {
                  icon: <Mail size={20} />,
                  href: "mailto:prashants0325@gmail.com",
                  label: "Email",
                },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target={
                    social.href.startsWith("http") ? "_blank" : undefined
                  }
                  rel={
                    social.href.startsWith("http")
                      ? "noopener noreferrer"
                      : undefined
                  }
                  aria-label={social.label}
                  className="p-3 rounded-full text-white/40 hover:text-accent-orange transition-all duration-500 hover:scale-110 hover:bg-white/5"
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
                document
                  .querySelector("#about")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              aria-label="Scroll to about section"
              className="flex flex-col items-center gap-2 text-white/25 hover:text-accent-orange transition-colors"
            >
              <span className="text-[10px] tracking-[0.3em] uppercase font-medium">
                Scroll
              </span>
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <ArrowDown size={16} />
              </motion.div>
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
