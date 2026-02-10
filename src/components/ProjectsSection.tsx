"use client";

import { useState, useRef, MouseEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { ExternalLink, Github, ChevronDown, ChevronUp } from "lucide-react";
import RevealOnScroll from "./RevealOnScroll";

interface Project {
  title: string;
  tagline: string;
  description: string;
  tech: string[];
  metrics: string[];
  features: string[];
  liveUrl?: string;
  githubUrl?: string;
  category: "web" | "ml" | "data";
}

const projects: Project[] = [
  {
    title: "Scotia Delights",
    tagline: "Full-Stack E-Commerce Platform",
    description:
      "Production-ready e-commerce with secure payment processing, real-time cart sync, and admin analytics. Features automated PDF invoices and enterprise security.",
    tech: ["Next.js", "TypeScript", "Supabase", "Razorpay", "Tailwind", "Redis", "Sentry"],
    metrics: ["Secure Payments", "Real-time Sync", "Enterprise Security"],
    features: [
      "Integrated dual payment: Razorpay gateway + Cash on Delivery",
      "Real-time cart synchronization across devices",
      "Admin analytics dashboard with revenue tracking",
      "Automated PDF invoice generation and email delivery",
      "Row-Level Security (RLS) policies for data protection",
      "Sentry integration for error monitoring",
      "Redis-based rate limiting for API protection",
    ],
    liveUrl: "https://www.scotiadelights.in/",
    category: "web",
  },
  {
    title: "Luxe",
    tagline: "Mid-Luxury E-Commerce Experience",
    description:
      "Conversion-optimized platform targeting mid-luxury market with sub-2.5s load times and premium UX.",
    tech: ["Next.js 14", "TypeScript", "PostgreSQL", "Supabase", "Tailwind"],
    metrics: ["<2.5s Load", "15+ Tables", "Mobile-first UX"],
    features: [
      "Role-based admin dashboard with product management",
      "PostgreSQL database with 15+ normalized tables",
      "Row-Level Security policies for secure data access",
      "Server components for optimal performance",
      "OAuth and passwordless authentication",
      "Mobile-first responsive design with luxury aesthetics",
      "Optimized image delivery achieving <2.5s load times",
    ],
    liveUrl: "https://luxar.vercel.app/",
    category: "web",
  },
  {
    title: "CleanIQ",
    tagline: "AI-Powered Data Cleaning SaaS",
    description:
      "Intelligent data cleaning platform that auto-detects quality issues and applies one-click fixes for data analysts.",
    tech: ["Next.js", "React", "TypeScript", "Tailwind", "Zustand"],
    metrics: ["Auto-detect Issues", "One-click Fixes", "Multi-format"],
    features: [
      "AI-powered auto-detection of duplicates, missing values, outliers",
      "One-click intelligent fixes with preview",
      "Interactive data visualizations dashboard",
      "Multi-format file support: CSV, Excel, JSON",
      "Real-time data quality scoring",
      "Zustand for efficient state management",
      "Production-ready SaaS interface",
    ],
    liveUrl: "https://clean-ai-psi.vercel.app/",
    category: "web",
  },
  {
    title: "Retail Sales Analytics",
    tagline: "Enterprise Business Intelligence",
    description:
      "ETL and analytics pipeline processing 800K+ retail transactions for revenue optimization and customer segmentation.",
    tech: ["Python", "Pandas", "NumPy", "MySQL", "Power BI", "DAX"],
    metrics: ["800K+ Transactions", "$17.7M Analyzed", "15+ DAX Measures"],
    features: [
      "ETL pipeline processing 800,000+ transaction records",
      "Analyzed $17.7M revenue dataset with key patterns",
      "Interactive Power BI dashboard with 15+ custom DAX measures",
      "Identified 82% UK market concentration",
      "RFM analysis segmenting 5,878 customers",
      "Discovered top 15% customers generate 60%+ revenue",
      "Peak hour and seasonal trend analysis",
    ],
    category: "data",
  },
  {
    title: "Customer Behavior Analysis",
    tagline: "End-to-End Data Analytics",
    description:
      "Comprehensive customer behavior analysis revealing purchasing patterns, loyalty trends, and demographic insights.",
    tech: ["Python", "SQL", "Power BI", "Pandas", "NumPy"],
    metrics: ["3,900+ Transactions", "77% Loyalty", "$231K Analyzed"],
    features: [
      "ETL and data cleaning on 3,900+ transactions",
      "20+ SQL queries for customer segmentation",
      "Interactive Power BI dashboard with drill-down capabilities",
      "Identified 77% customer loyalty rate",
      "Analyzed $231K revenue patterns",
      "Demographic segmentation for high-value profiles",
      "Actionable recommendations for targeted marketing",
    ],
    githubUrl: "https://github.com/DazedSaturn07/Customer_Behaviour_Analysis",
    category: "data",
  },
  {
    title: "Face Mask Recognition",
    tagline: "Real-Time Computer Vision",
    description:
      "Deep learning-powered application for real-time face mask detection and counting through live video feeds.",
    tech: ["Python", "OpenCV", "TensorFlow", "Deep Learning"],
    metrics: ["Real-time Detection", "Multi-face Tracking", "High Accuracy"],
    features: [
      "Real-time face mask detection using custom CNN model",
      "Live video feed processing with multi-face tracking",
      "Accurate face counting with occlusion handling",
      "IoU-based tracking to solve duplicate counting",
      "Optimized inference pipeline for smooth performance",
      "Responsive web interface for deployment",
    ],
    githubUrl: "https://github.com/DazedSaturn07/Face_Mask_Recognition",
    category: "ml",
  },
  {
    title: "Hybrid Dataset Cleaner",
    tagline: "Local ML-Powered Preprocessing",
    description:
      "Advanced hybrid ML system combining rule-based processing, classical ML, and deep learning for automated dataset cleaning.",
    tech: ["Python", "Pandas", "Scikit-learn", "PyTorch", "PyOD"],
    metrics: ["Hybrid ML", "Explainable", "Local Processing"],
    features: [
      "Hybrid: rule-based + classical ML + autoencoder anomaly detection",
      "Automated missing value handling with multiple strategies",
      "Intelligent outlier detection using PyOD isolation forests",
      "Duplicate detection with fuzzy matching",
      "Explainable transformation reports",
      "Conservative data preservation principles",
      "100% local processing for data privacy",
    ],
    githubUrl: "https://github.com/DazedSaturn07/DataCleaner",
    category: "ml",
  },
];

const categories = [
  { key: "all", label: "All" },
  { key: "web", label: "Web Apps" },
  { key: "ml", label: "ML & AI" },
  { key: "data", label: "Data Analytics" },
];

/** 3D tilt card that reacts to mouse position */
function TiltCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rotateX = (y - 0.5) * -8;
    const rotateY = (x - 0.5) * 8;
    cardRef.current.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    // Glow follow
    cardRef.current.style.setProperty("--mouse-x", `${x * 100}%`);
    cardRef.current.style.setProperty("--mouse-y", `${y * 100}%`);
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
  };

  return (
    <div
      ref={cardRef}
      className={`transition-transform duration-300 ease-out ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transformStyle: "preserve-3d" }}
    >
      {children}
    </div>
  );
}

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.05 });
  const num = String(index + 1).padStart(2, "0");

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 0.7,
        delay: index * 0.08,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <TiltCard className="h-full">
        <div className="glass glow-card overflow-hidden flex flex-col h-full relative">
          {/* Gradient Header */}
          <div
            className="h-44 relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, rgba(255,140,66,0.1) 0%, rgba(139,92,246,0.05) 50%, rgba(11,15,20,0.95) 100%)`,
            }}
          >
            {/* Ghost number */}
            <span className="absolute top-3 right-4 font-display font-bold text-5xl text-white/[0.04] select-none">
              {num}
            </span>
            {/* Metrics */}
            <div className="absolute bottom-3 left-4 right-4 flex flex-wrap gap-1.5">
              {project.metrics.map((metric) => (
                <span
                  key={metric}
                  className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                  style={{
                    background: "rgba(255,140,66,0.12)",
                    color: "#F59E42",
                    border: "1px solid rgba(255,140,66,0.2)",
                  }}
                >
                  {metric}
                </span>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-5 flex flex-col flex-1">
            <h3 className="font-display font-bold text-lg text-white mb-1">{project.title}</h3>
            <p className="text-accent-warm/70 text-xs font-medium mb-3 tracking-wide uppercase">
              {project.tagline}
            </p>
            <p className="text-white/45 text-sm leading-relaxed mb-4 line-clamp-2">
              {project.description}
            </p>

            {/* Tech Stack */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {project.tech.slice(0, 5).map((t) => (
                <span
                  key={t}
                  className="text-[10px] px-2.5 py-1 rounded-full font-medium text-white/50"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  {t}
                </span>
              ))}
              {project.tech.length > 5 && (
                <span className="text-[10px] px-2 py-1 text-white/30">
                  +{project.tech.length - 5}
                </span>
              )}
            </div>

            {/* Expandable Features */}
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden mb-4"
                >
                  <ul className="space-y-1.5 pt-2 border-t border-white/5">
                    {project.features.map((f, i) => (
                      <li key={i} className="text-white/40 text-xs flex items-start gap-2">
                        <span className="text-accent-orange mt-0.5 shrink-0">›</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="mt-auto pt-3 flex flex-wrap gap-2 items-center border-t border-white/5">
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-4 py-2 rounded-full text-white transition-all hover:scale-[1.03] active:scale-[0.98] hover:shadow-[0_0_20px_rgba(245,158,66,0.25)]"
                  style={{ background: "linear-gradient(135deg, #F59E42, #FF8C42)" }}
                >
                  <ExternalLink size={11} /> Live Demo
                </a>
              )}
              {project.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-4 py-2 rounded-full text-white/60 border border-white/10 hover:border-accent-orange/30 hover:text-white hover:scale-[1.03] active:scale-[0.98] transition-all"
                >
                  <Github size={11} /> GitHub
                </a>
              )}
              <button
                onClick={() => setExpanded(!expanded)}
                className="inline-flex items-center gap-1 text-[11px] text-white/35 hover:text-accent-orange transition-colors ml-auto"
                aria-expanded={expanded}
                aria-label={expanded ? "Show less details" : "Show more details"}
              >
                {expanded ? (
                  <>Less <ChevronUp size={13} /></>
                ) : (
                  <>Details <ChevronDown size={13} /></>
                )}
              </button>
            </div>
          </div>
        </div>
      </TiltCard>
    </motion.div>
  );
}

export default function ProjectsSection() {
  const [filter, setFilter] = useState("all");
  const { ref } = useInView({ triggerOnce: true, threshold: 0.02 });

  const filtered = filter === "all" ? projects : projects.filter((p) => p.category === filter);

  return (
    <section id="projects" className="py-24 md:py-36 px-4 md:px-8" ref={ref} aria-label="Projects">
      <div className="max-w-7xl mx-auto">
        <RevealOnScroll>
          <h2 className="font-display font-bold text-section gradient-text-static text-center mb-4">
            Featured Projects
          </h2>
          <p className="text-white/40 text-center mb-10 max-w-2xl mx-auto">
            A curated selection spanning full-stack development, machine learning, and data analytics.
          </p>
        </RevealOnScroll>

        {/* Filter Tabs */}
        <RevealOnScroll delay={0.1}>
          <div className="flex justify-center gap-2 mb-12 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setFilter(cat.key)}
                className={`relative text-sm font-medium px-5 py-2 rounded-full transition-all duration-300 ${filter === cat.key
                  ? "text-white"
                  : "text-white/40 hover:text-white/60"
                  }`}
              >
                {filter === cat.key && (
                  <motion.span
                    layoutId="projectFilter"
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: "rgba(255,140,66,0.12)",
                      border: "1px solid rgba(255,140,66,0.2)",
                    }}
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{cat.label}</span>
              </button>
            ))}
          </div>
        </RevealOnScroll>

        {/* Projects Grid */}
        <motion.div
          layout
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((project, i) => (
              <ProjectCard key={project.title} project={project} index={i} />
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
