import { CSSProperties, useCallback, useRef, useState } from "react";
import { motion, useMotionValueEvent, useScroll, useSpring, useTransform, type MotionValue } from "framer-motion";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { useSectionOutroMotion } from "./useSectionOutroMotion";

export interface Project {
  title: string;
  category: string;
  description: string;
  tech: string[];
  liveUrl: string;
  image: string;
  result: string;
  role: string;
  year: string;
}

export const projects: Project[] = [
  {
    title: "Scotia Delights",
    category: "Food Brand Website",
    description:
      "A premium bakery and hamper commerce experience focused on conversion, product storytelling, and ordering clarity.",
    tech: ["Next.js", "Motion"],
    liveUrl: "https://www.scotiadelights.in/",
    image: "/images/Scotia.avif",
    result: "+43% product engagement",
    role: "Brand system / storefront",
    year: "2026",
  },
  {
    title: "Luxar",
    category: "Luxury Product Experience",
    description:
      "A high-contrast luxury interior product site with editorial pacing, motion detail, and immersive product sections.",
    tech: ["Next.js", "Framer Motion"],
    liveUrl: "https://luxar.vercel.app/",
    image: "/images/Luxe.avif",
    result: "+31% session duration",
    role: "Art direction / interaction",
    year: "2026",
  },
  {
    title: "Clean AI",
    category: "AI SaaS Landing",
    description:
      "A technical SaaS landing page built for fast feature discovery, clear onboarding, and confident demo conversion.",
    tech: ["Next.js", "TypeScript"],
    liveUrl: "https://clean-ai-psi.vercel.app/",
    image: "/images/CleanAi.avif",
    result: "+28% demo requests",
    role: "Product narrative / UI",
    year: "2026",
  },
  {
    title: "RS Staging",
    category: "Service Business Website",
    description:
      "A polished home staging and architecture portfolio using clean grids, spatial imagery, and direct contact paths.",
    tech: ["React", "Netlify"],
    liveUrl: "https://rsstaging.netlify.app/",
    image: "/images/RSStaging.avif",
    result: "+37% contact conversion",
    role: "Portfolio / conversion",
    year: "2025",
  },
  {
    title: "Hortic",
    category: "Industry Portfolio",
    description:
      "A modern horticulture web presence balancing practical industry messaging with a fresh visual system.",
    tech: ["React", "Tailwind"],
    liveUrl: "https://hortic.netlify.app/",
    image: "/images/Hortic.avif",
    result: "+25% returning visitors",
    role: "Industry website",
    year: "2025",
  },
  {
    title: "Interior Design LA",
    category: "Interior Studio Presence",
    description:
      "A visual-first studio site with spatial storytelling, refined contrast, and high-end portfolio presentation.",
    tech: ["React", "Motion"],
    liveUrl: "https://interiordesignla.netlify.app/",
    image: "/images/3d_DesignLA.avif",
    result: "3.2x inquiry quality",
    role: "Visual system / motion",
    year: "2025",
  },
];

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function getScrollyRange(index: number, total: number) {
  if (total <= 1) {
    return { start: 0, center: 0.5, end: 1 };
  }

  const step = 1 / (total - 1);
  const center = index * step;
  const overlap = step * 0.72;

  return {
    start: clamp(center - overlap, 0, 1),
    center,
    end: clamp(center + overlap, 0, 1),
  };
}

export function WorkSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeProjectIndex, setActiveProjectIndex] = useState(0);
  const projectScrollUnits = Math.max(projects.length * 92, 360);
  const overlayScrollUnits = 100;
  const sectionScrollHeight = `${projectScrollUnits + overlayScrollUnits}svh`;
  const projectScrollEnd = (projectScrollUnits - 100) / projectScrollUnits;

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const projectProgress = useTransform(
    scrollYProgress,
    [0, projectScrollEnd],
    [0, 1]
  );

  const smoothProgress = useSpring(projectProgress, {
    stiffness: 80,
    damping: 24,
    mass: 0.34,
    restDelta: 0.001,
  });
  const { opacity: sectionOpacity, y: sectionY } = useSectionOutroMotion(sectionRef, {
    offset: ["start start", "end end"],
    fadeRange: [projectScrollEnd, 1],
  });

  const deviceScale = useTransform(smoothProgress, [0, 0.48, 1], [0.94, 1, 0.96]);
  const deviceY = useTransform(smoothProgress, [0, 1], [34, -34]);
  const deviceRotate = useTransform(smoothProgress, [0, 1], [-1.8, 1.8]);
  const titleY = useTransform(smoothProgress, [0, 0.45, 1], [42, -8, -54]);

  useMotionValueEvent(projectProgress, "change", (latest) => {
    const nextIndex = clamp(Math.round(latest * (projects.length - 1)), 0, projects.length - 1);
    setActiveProjectIndex((current) => (current === nextIndex ? current : nextIndex));
  });

  const scrollToProject = useCallback((index: number) => {
    const section = sectionRef.current;
    if (!section) return;

    const top = section.offsetTop;
    const scrollable = section.offsetHeight - window.innerHeight;
    const target = top + scrollable * projectScrollEnd * (index / Math.max(projects.length - 1, 1));

    window.scrollTo({ top: target, behavior: "smooth" });
  }, [projectScrollEnd]);

  return (
    <section
      id="work"
      ref={sectionRef}
      className="cinema-section cinema-work-scrolly"
      style={
        {
          "--project-count": projects.length,
          "--work-scroll-height": sectionScrollHeight,
        } as CSSProperties
      }
    >
      <motion.div className="cinema-work-sticky" style={{ opacity: sectionOpacity, y: sectionY }}>
        {projects.map((project, index) => (
          <WorkBackdropLayer
            key={project.title}
            project={project}
            index={index}
            total={projects.length}
            progress={smoothProgress}
          />
        ))}

        <div className="cinema-work-layout">
          <div className="cinema-work-copy">
            <motion.div style={{ y: titleY }}>
              <p className="cinema-kicker">Work / Selected projects</p>
              <h2 className="cinema-work-title">
                Projects
              </h2>
            </motion.div>

            <div className="cinema-project-story-stack">
              {projects.map((project, index) => (
                <WorkStoryLayer
                  key={project.title}
                  project={project}
                  index={index}
                  total={projects.length}
                  progress={smoothProgress}
                  isActive={activeProjectIndex === index}
                />
              ))}
            </div>
          </div>

          <div className="cinema-showcase">
            <motion.div
              className="cinema-device"
              style={{ scale: deviceScale, y: deviceY, rotate: deviceRotate }}
              data-cursor="interactive"
            >
              <div className="cinema-device-bar">
                <span />
                <span />
                <span />
              </div>
              <div className="cinema-device-screen">
                {projects.map((project, index) => (
                  <WorkDeviceLayer
                    key={project.title}
                    project={project}
                    index={index}
                    total={projects.length}
                    progress={smoothProgress}
                  />
                ))}
                <div className="cinema-device-sheen" aria-hidden="true" />
              </div>
            </motion.div>

            <div className="cinema-work-stepper" aria-label="Project timeline">
              {projects.map((project, index) => (
                <button
                  type="button"
                  key={project.title}
                  className={activeProjectIndex === index ? "is-active" : ""}
                  onClick={() => scrollToProject(index)}
                  data-cursor="interactive"
                  aria-label={`Jump to ${project.title}`}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{project.title}</strong>
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="cinema-work-mobile">
        <p className="cinema-kicker">Selected work / Mobile narrative</p>
        <h2 className="cinema-work-title">
          Case <span className="cinema-outline">Studies</span>
        </h2>
        <div className="cinema-mobile-projects">
          {projects.map((project, index) => (
            <a
              key={project.title}
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="cinema-mobile-project"
              data-cursor="interactive"
            >
              <Image
                src={project.image}
                alt={`${project.title} preview`}
                fill
                sizes="92vw"
                className="cinema-mobile-project-image"
              />
              <div className="cinema-mobile-project-content">
                <span>{String(index + 1).padStart(2, "0")} / {project.category}</span>
                <h3>{project.title}</h3>
                <p>{project.description}</p>
                <strong>{project.result}</strong>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

interface WorkLayerProps {
  project: Project;
  index: number;
  total: number;
  progress: MotionValue<number>;
}

function WorkBackdropLayer({ project, index, total, progress }: WorkLayerProps) {
  const { start, center, end } = getScrollyRange(index, total);
  const isFirst = index === 0;
  const isLast = index === total - 1;
  const input = isFirst ? [0, end] : isLast ? [start, 1] : [start, center, end];

  const opacity = useTransform(
    progress,
    input,
    isFirst ? [0.42, 0] : isLast ? [0, 0.42] : [0, 0.42, 0]
  );
  const scale = useTransform(
    progress,
    input,
    isFirst ? [1.04, 1.12] : isLast ? [1.12, 1.04] : [1.12, 1.04, 1.1]
  );
  const y = useTransform(
    progress,
    input,
    isFirst ? [0, -24] : isLast ? [24, 0] : [28, 0, -28]
  );

  return (
    <motion.div
      className="cinema-work-backdrop"
      style={{ opacity, scale, y }}
      aria-hidden="true"
    >
      <Image
        src={project.image}
        alt=""
        fill
        sizes="100vw"
        className="cinema-work-backdrop-image"
      />
    </motion.div>
  );
}

function WorkStoryLayer({
  project,
  index,
  total,
  progress,
  isActive,
}: WorkLayerProps & { isActive: boolean }) {
  const { start, center, end } = getScrollyRange(index, total);
  const isFirst = index === 0;
  const isLast = index === total - 1;
  const input = isFirst ? [0, end] : isLast ? [start, 1] : [start, center, end];

  const opacity = useTransform(
    progress,
    input,
    isFirst ? [1, 0] : isLast ? [0, 1] : [0, 1, 0]
  );
  const y = useTransform(
    progress,
    input,
    isFirst ? [0, -54] : isLast ? [54, 0] : [54, 0, -54]
  );
  const scale = useTransform(
    progress,
    input,
    isFirst ? [1, 0.98] : isLast ? [0.98, 1] : [0.98, 1, 0.98]
  );
  const filter = useTransform(
    progress,
    input,
    isFirst
      ? ["blur(0px)", "blur(14px)"]
      : isLast
        ? ["blur(14px)", "blur(0px)"]
        : ["blur(14px)", "blur(0px)", "blur(14px)"]
  );

  return (
    <motion.div
      className={`cinema-project-story${isActive ? " is-active" : ""}`}
      style={{ opacity, y, scale, filter, zIndex: isActive ? 3 : 1 }}
      aria-hidden={!isActive}
    >
      <div className="cinema-story-count">
        <span>{String(index + 1).padStart(2, "0")}</span>
        <i />
        <span>{String(total).padStart(2, "0")}</span>
      </div>
      <p className="cinema-project-category">{project.category}</p>
      <h3>{project.title}</h3>
      <p>{project.description}</p>
      <dl className="cinema-project-facts">
        <div>
          <dt>Impact</dt>
          <dd>{project.result}</dd>
        </div>
        <div>
          <dt>Role</dt>
          <dd>{project.role}</dd>
        </div>
        <div>
          <dt>Year</dt>
          <dd>{project.year}</dd>
        </div>
      </dl>
      <div className="cinema-project-actions">
        <a
          href={project.liveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="cinema-primary-link"
          data-cursor="interactive"
          tabIndex={isActive ? 0 : -1}
        >
          Open live
          <ExternalLink size={17} />
        </a>
        <div className="cinema-project-tech">
          {project.tech.map((tech) => (
            <small key={tech}>{tech}</small>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function WorkDeviceLayer({ project, index, total, progress }: WorkLayerProps) {
  const { start, center, end } = getScrollyRange(index, total);
  const isFirst = index === 0;
  const isLast = index === total - 1;
  const input = isFirst ? [0, end] : isLast ? [start, 1] : [start, center, end];

  const opacity = useTransform(
    progress,
    input,
    isFirst ? [1, 0] : isLast ? [0, 1] : [0, 1, 0]
  );
  const scale = useTransform(
    progress,
    input,
    isFirst ? [1, 1.08] : isLast ? [1.08, 1] : [1.08, 1, 0.96]
  );
  const y = useTransform(
    progress,
    input,
    isFirst ? [0, -52] : isLast ? [52, 0] : [52, 0, -52]
  );
  const rotate = useTransform(
    progress,
    input,
    isFirst ? [0, -1.4] : isLast ? [1.4, 0] : [1.4, 0, -1.4]
  );
  const filter = useTransform(
    progress,
    input,
    isFirst
      ? ["blur(0px) saturate(1)", "blur(18px) saturate(0.5)"]
      : isLast
        ? ["blur(18px) saturate(0.5)", "blur(0px) saturate(1)"]
        : [
            "blur(18px) saturate(0.5)",
            "blur(0px) saturate(1)",
            "blur(18px) saturate(0.5)",
          ]
  );

  return (
    <motion.div
      className="cinema-device-image-wrap"
      style={{ opacity, scale, y, rotate, filter, zIndex: index + 1 }}
    >
      <Image
        src={project.image}
        alt={`${project.title} preview`}
        fill
        sizes="(max-width: 1024px) 92vw, 58vw"
        className="cinema-device-image"
      />
    </motion.div>
  );
}
