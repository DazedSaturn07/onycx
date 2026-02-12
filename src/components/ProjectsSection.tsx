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
  backgroundImage: string;
}

const projects: ProjectData[] = [
  {
    title: "Scotia Delights",
    tagline: "Full-Stack E-Commerce Platform",
    description:
      "Production-ready e-commerce with secure payment processing, real-time cart sync, and admin analytics. Features automated PDF invoices and enterprise security.",
    tech: ["Next.js", "TypeScript", "Supabase", "Razorpay", "Tailwind", "Redis", "Sentry"],
    liveUrl: "https://www.scotiadelights.in/",
    backgroundImage:
      "https://images.pexels.com/photos/230544/pexels-photo-230544.jpeg?auto=compress&cs=tinysrgb&w=1260",
  },
  {
    title: "Luxe",
    tagline: "Mid-Luxury E-Commerce Experience",
    description:
      "Conversion-optimized platform targeting mid-luxury market with sub-2.5s load times and premium UX.",
    tech: ["Next.js 14", "TypeScript", "PostgreSQL", "Supabase", "Tailwind"],
    liveUrl: "https://luxar.vercel.app/",
    backgroundImage:
      "https://images.pexels.com/photos/5632399/pexels-photo-5632399.jpeg?auto=compress&cs=tinysrgb&w=1260",
  },
  {
    title: "CleanIQ",
    tagline: "AI-Powered Data Cleaning SaaS",
    description:
      "Intelligent data cleaning platform that auto-detects quality issues and applies one-click fixes for data analysts.",
    tech: ["Next.js", "React", "TypeScript", "Tailwind", "Zustand"],
    liveUrl: "https://clean-ai-psi.vercel.app/",
    backgroundImage:
      "https://images.pexels.com/photos/7988079/pexels-photo-7988079.jpeg?auto=compress&cs=tinysrgb&w=1260",
  },
  {
    title: "Retail Sales Analytics",
    tagline: "Enterprise Business Intelligence",
    description:
      "ETL and analytics pipeline processing 800K+ retail transactions for revenue optimization and customer segmentation.",
    tech: ["Python", "Pandas", "NumPy", "MySQL", "Power BI", "DAX"],
    backgroundImage:
      "https://images.pexels.com/photos/590041/pexels-photo-590041.jpeg?auto=compress&cs=tinysrgb&w=1260",
  },
  {
    title: "Customer Behavior Analysis",
    tagline: "End-to-End Data Analytics",
    description:
      "Comprehensive customer behavior analysis revealing purchasing patterns, loyalty trends, and demographic insights.",
    tech: ["Python", "SQL", "Power BI", "Pandas", "NumPy"],
    githubUrl: "https://github.com/DazedSaturn07/Customer_Behaviour_Analysis",
    backgroundImage:
      "https://images.pexels.com/photos/6801648/pexels-photo-6801648.jpeg?auto=compress&cs=tinysrgb&w=1260",
  },
  {
    title: "Face Mask Recognition",
    tagline: "Real-Time Computer Vision",
    description:
      "Deep learning-powered application for real-time face mask detection and counting through live video feeds.",
    tech: ["Python", "OpenCV", "TensorFlow", "Deep Learning"],
    githubUrl: "https://github.com/DazedSaturn07/Face_Mask_Recognition",
    backgroundImage:
      "https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=1260",
  },
  {
    title: "Hybrid Dataset Cleaner",
    tagline: "Local ML-Powered Preprocessing",
    description:
      "Advanced hybrid ML system combining rule-based processing, classical ML, and deep learning for automated dataset cleaning.",
    tech: ["Python", "Pandas", "Scikit-learn", "PyTorch", "PyOD"],
    githubUrl: "https://github.com/DazedSaturn07/DataCleaner",
    backgroundImage:
      "https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=1260",
  },
];

/* ── Build rich card content for each project ── */
function ProjectCardContent({ project }: { project: ProjectData }) {
  return (
    <div className="flex flex-col justify-center h-full w-full max-w-xl gap-3">
      {/* Tagline */}
      <span
        className="text-[11px] sm:text-xs font-semibold tracking-[0.15em] uppercase"
        style={{ color: "#F59E42" }}
      >
        {project.tagline}
      </span>

      {/* Title */}
      <h3 className="font-display font-bold text-2xl sm:text-3xl md:text-4xl text-white leading-tight">
        {project.title}
      </h3>

      {/* Description */}
      <p className="text-white/65 text-sm sm:text-base leading-relaxed line-clamp-3">
        {project.description}
      </p>

      {/* Tech Stack */}
      <div className="flex flex-wrap gap-1.5 mt-1">
        {project.tech.map((t) => (
          <span
            key={t}
            className="text-[10px] sm:text-[11px] px-2.5 py-1 rounded-full font-medium"
            style={{
              background: "rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.7)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            {t}
          </span>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 mt-2">
        {project.liveUrl && (
          <a
            href={project.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-5 py-2.5 rounded-full text-white transition-all hover:scale-[1.04] active:scale-[0.97] hover:shadow-[0_0_24px_rgba(245,158,66,0.3)]"
            style={{ background: "linear-gradient(135deg, #F59E42, #FF8C42)" }}
          >
            <ExternalLink size={13} />
            Live Demo
          </a>
        )}
        {project.githubUrl && (
          <a
            href={project.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-5 py-2.5 rounded-full text-white/70 border border-white/15 hover:border-[#F59E42]/40 hover:text-white hover:scale-[1.04] active:scale-[0.97] transition-all backdrop-blur-sm"
          >
            <Github size={13} />
            GitHub
          </a>
        )}
      </div>
    </div>
  );
}

/* ── Convert projects to ScrollStack cards ── */
const scrollStackCards: ScrollStackCard[] = projects.map((project) => ({
  title: project.title,
  subtitle: project.tagline,
  backgroundImage: project.backgroundImage,
  badge: project.liveUrl ? "Live" : project.githubUrl ? "Open Source" : undefined,
  content: <ProjectCardContent project={project} />,
}));

export default function ProjectsSection() {
  return (
    <section id="projects" aria-label="Projects">
      {/* Section header — outside the scroll-hijacking area */}
      <div className="py-20 md:py-28 px-4 md:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <RevealOnScroll>
            <h2 className="font-display font-bold text-section gradient-text-static mb-4">
              Featured Projects
            </h2>
            <p className="text-white/40 max-w-2xl mx-auto">
              A curated selection spanning data analytics, machine
              learning, and full-stack development — scroll to explore each project.
            </p>
          </RevealOnScroll>
        </div>
      </div>

      {/* ScrollStack */}
      <ScrollStack
        cards={scrollStackCards}
        backgroundColor="bg-[#0b0f14]"
        cardHeight="65vh"
        sectionHeightMultiplier={5}
        animationDuration="0.5s"
      />
    </section>
  );
}
