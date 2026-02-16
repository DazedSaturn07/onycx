"use client";

import { ExternalLink, Github } from "lucide-react";
import ScrollStack, { ScrollStackCard } from "./ScrollStack";
import RevealOnScroll from "./RevealOnScroll";

/* ── Project data ── */
interface ProjectData {
  title: string;
  tagline: string;
  description: string;
  tech: string[];
  liveUrl?: string;
  githubUrl?: string;
  // For live sites, we show an iframe preview; for others, a dark-themed bg
  previewUrl?: string;
}

const projects: ProjectData[] = [
  {
    title: "Scotia Delights",
    tagline: "Full-Stack E-Commerce Platform",
    description:
      "Production-ready e-commerce with secure payment processing, real-time cart sync, and admin analytics. Features automated PDF invoices and enterprise security.",
    tech: ["Next.js", "TypeScript", "Supabase", "Razorpay", "Tailwind", "Redis", "Sentry"],
    liveUrl: "https://www.scotiadelights.in/",
    // previewUrl: "https://www.scotiadelights.in/", // Blocked by X-Frame-Options
  },
  {
    title: "Luxe",
    tagline: "Mid-Luxury E-Commerce Experience",
    description:
      "Conversion-optimized platform targeting mid-luxury market with sub-2.5s load times and premium UX.",
    tech: ["Next.js 14", "TypeScript", "PostgreSQL", "Supabase", "Tailwind"],
    liveUrl: "https://luxar.vercel.app/",
    previewUrl: "https://luxar.vercel.app/",
  },
  {
    title: "CleanIQ",
    tagline: "AI-Powered Data Cleaning SaaS",
    description:
      "Intelligent data cleaning platform that auto-detects quality issues and applies one-click fixes for data analysts.",
    tech: ["Next.js", "React", "TypeScript", "Tailwind", "Zustand"],
    liveUrl: "https://clean-ai-psi.vercel.app/",
    previewUrl: "https://clean-ai-psi.vercel.app/",
  },
  {
    title: "Retail Sales Analytics",
    tagline: "Enterprise Business Intelligence",
    description:
      "ETL and analytics pipeline processing 800K+ retail transactions for revenue optimization and customer segmentation.",
    tech: ["Python", "Pandas", "NumPy", "MySQL", "Power BI", "DAX"],
  },
  {
    title: "Customer Behavior Analysis",
    tagline: "End-to-End Data Analytics",
    description:
      "Comprehensive customer behavior analysis revealing purchasing patterns, loyalty trends, and demographic insights.",
    tech: ["Python", "SQL", "Power BI", "Pandas", "NumPy"],
    githubUrl: "https://github.com/DazedSaturn07/Customer_Behaviour_Analysis",
  },
  {
    title: "Face Mask Recognition",
    tagline: "Real-Time Computer Vision",
    description:
      "Deep learning-powered application for real-time face mask detection and counting through live video feeds.",
    tech: ["Python", "OpenCV", "TensorFlow", "Deep Learning"],
    githubUrl: "https://github.com/DazedSaturn07/Face_Mask_Recognition",
  },
  {
    title: "Hybrid Dataset Cleaner",
    tagline: "Local ML-Powered Preprocessing",
    description:
      "Advanced hybrid ML system combining rule-based processing, classical ML, and deep learning for automated dataset cleaning.",
    tech: ["Python", "Pandas", "Scikit-learn", "PyTorch", "PyOD"],
    githubUrl: "https://github.com/DazedSaturn07/DataCleaner",
  },
];

/* ── Site Preview (iframe for live sites) ── */
function SitePreview({ url, title }: { url: string; title: string }) {
  return (
    <div className="absolute inset-0 z-0">
      <div className="absolute inset-0 overflow-hidden rounded-[20px]">
        <iframe
          src={url}
          title={`${title} preview`}
          className="w-full h-full border-0 pointer-events-none"
          loading="lazy"
          sandbox="allow-scripts allow-same-origin"
          style={{
            transform: "scale(1)",
            transformOrigin: "top left",
            width: "100%",
            height: "100%",
          }}
        />
      </div>
      {/* Dark gradient overlay so text remains readable */}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(135deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.4) 100%)",
        }}
      />
    </div>
  );
}

/* ── Dark themed abstract background for non-live projects ── */
function DarkAbstractBg({ index }: { index: number }) {
  // Subtle gradient background that matches the dark theme
  const gradients = [
    "radial-gradient(ellipse at 20% 30%, rgba(255,140,66,0.08), transparent 60%), radial-gradient(ellipse at 80% 70%, rgba(34,211,238,0.05), transparent 50%)",
    "radial-gradient(ellipse at 70% 20%, rgba(139,92,246,0.08), transparent 60%), radial-gradient(ellipse at 30% 80%, rgba(255,140,66,0.05), transparent 50%)",
    "radial-gradient(ellipse at 40% 50%, rgba(34,211,238,0.06), transparent 60%), radial-gradient(ellipse at 80% 30%, rgba(52,211,153,0.05), transparent 50%)",
    "radial-gradient(ellipse at 60% 40%, rgba(251,113,133,0.06), transparent 60%), radial-gradient(ellipse at 20% 70%, rgba(139,92,246,0.05), transparent 50%)",
  ];

  return (
    <div className="absolute inset-0 z-0">
      <div
        className="absolute inset-0"
        style={{
          background: `#050505`,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: gradients[index % gradients.length],
        }}
      />
      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />
    </div>
  );
}

/* ── Build rich card content for each project ── */
function ProjectCardContent({ project }: { project: ProjectData }) {
  return (
    <div className="flex flex-col justify-center h-full w-full max-w-2xl gap-3 sm:gap-4">
      {/* Tagline */}
      <span
        className="text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase"
        style={{
          background: "linear-gradient(90deg, #FFB366, #F59E42)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        {project.tagline}
      </span>

      {/* Title */}
      <h3 className="font-headline font-bold text-2xl sm:text-3xl md:text-5xl text-white leading-tight tracking-[-0.02em]">
        {project.title}
      </h3>

      {/* Description */}
      <p className="text-white/55 text-sm sm:text-base md:text-lg leading-relaxed line-clamp-3">
        {project.description}
      </p>

      {/* Tech Stack */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-1">
        {project.tech.map((t) => (
          <span
            key={t}
            className="text-[9px] sm:text-[11px] px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full font-semibold"
            style={{
              background: "rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.7)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {t}
          </span>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 mt-1 sm:mt-2">
        {project.liveUrl && (
          <a
            href={project.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold px-4 sm:px-6 py-2.5 sm:py-3 rounded-full text-white transition-all duration-500 hover:scale-[1.04] active:scale-[0.97] hover:shadow-[0_0_30px_rgba(245,158,66,0.35)]"
            style={{ background: "linear-gradient(135deg, #F59E42, #FF8C42, #E85D04)" }}
          >
            <ExternalLink size={14} />
            Live Demo
          </a>
        )}
        {project.githubUrl && (
          <a
            href={project.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold px-4 sm:px-6 py-2.5 sm:py-3 rounded-full text-white/70 border border-white/12 hover:border-[#F59E42]/40 hover:text-white hover:scale-[1.04] active:scale-[0.97] transition-all duration-500 hover:bg-white/5"
          >
            <Github size={14} />
            GitHub
          </a>
        )}
      </div>
    </div>
  );
}

/* ── Convert projects to ScrollStack cards ── */
const scrollStackCards: ScrollStackCard[] = projects.map((project, index) => ({
  title: project.title,
  subtitle: project.tagline,
  badge: project.liveUrl ? "Live" : project.githubUrl ? "Open Source" : undefined,
  content: (
    <div className="relative w-full h-full flex items-center">
      {/* Background: iframe preview for live sites, dark abstract for others */}
      {project.previewUrl ? (
        <SitePreview url={project.previewUrl} title={project.title} />
      ) : (
        <DarkAbstractBg index={index - 3} />
      )}
      <div className="relative z-10 p-0">
        <ProjectCardContent project={project} />
      </div>
    </div>
  ),
}));

export default function ProjectsSection() {
  return (
    <section id="projects" aria-label="Projects">
      {/* Section header */}
      <div className="py-16 md:py-28 px-4 md:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <RevealOnScroll>
            <div className="mb-6">
              <span className="inline-block text-xs font-bold tracking-[0.4em] uppercase text-accent-orange/70 mb-5">
                Portfolio
              </span>
            </div>
            <h2 className="font-headline font-bold text-section gradient-text-static mb-4">
              Featured Projects
            </h2>
            <p className="text-white/40 max-w-2xl mx-auto text-base sm:text-lg">
              A curated selection spanning data analytics, machine
              learning, and full-stack development — scroll to explore each project.
            </p>
          </RevealOnScroll>
        </div>
      </div>

      {/* ScrollStack */}
      <ScrollStack
        cards={scrollStackCards}
        cardHeight="75vh"
        sectionHeightMultiplier={6}
      />
    </section>
  );
}
