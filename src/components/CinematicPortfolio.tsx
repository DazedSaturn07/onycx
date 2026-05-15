"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
} from "framer-motion";
import { useLenis } from "lenis/react";
import Image from "next/image";
import {
  Download,
  Menu,
  X,
} from "lucide-react";

import { SectionId, HeroSection } from "./sections/HeroSection";
import { AboutSection } from "./sections/AboutSection";
import { WorkSection } from "./sections/WorkSection";
import { CertificatesSection } from "./sections/CertificatesSection";
import { ContactSection } from "./sections/ContactSection";


const EASE = [0.23, 1, 0.32, 1] as const;

type SectionMeta = {
  id: SectionId;
  label: string;
  preview: string;
};

const sections: SectionMeta[] = [
  { id: "home", label: "Home", preview: "/photo.png" },
  { id: "about", label: "About", preview: "/photo.png" },
  { id: "work", label: "Work", preview: "/images/Luxe.avif" },
  { id: "certificates", label: "Credentials", preview: "/certificates/21BCS2563_Prashant_IBM_final.webp" },
  { id: "contact", label: "Contact", preview: "/images/CleanAi.avif" },
];

export default function CinematicPortfolio() {
  const reduceMotion = useReducedMotion();
  useScroll();

  const [activeSectionId, setActiveSectionId] = useState<SectionId>("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [hoveredPreview, setHoveredPreview] = useState(sections[0].preview);
  const [isLoading, setIsLoading] = useState(true);
  const [loadPercent, setLoadPercent] = useState(0);

  const blobRefs = useRef<Array<HTMLDivElement | null>>([]);

  const activeIndex = useMemo(
    () => Math.max(0, sections.findIndex((section) => section.id === activeSectionId)),
    [activeSectionId]
  );

  const sectionNumber = useMemo(
    () => String(activeIndex + 1).padStart(2, "0"),
    [activeIndex]
  );

  const lenis = useLenis();

  const navigateToSection = useCallback((id: SectionId) => {
    const target = document.getElementById(id);
    setMenuOpen(false);
    setHoveredPreview(sections.find((section) => section.id === id)?.preview ?? sections[0].preview);
    if (lenis && target) {
      lenis.scrollTo(target, { duration: 1.5 });
    } else {
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [lenis]);

  useEffect(() => {
    let raf = 0;
    let start = 0;
    let finishTimer: ReturnType<typeof setTimeout> | undefined;

    const tick = (time: number) => {
      if (!start) start = time;
      const rawProgress = Math.min((time - start) / 1200, 1);
      const easedProgress = 1 - Math.pow(1 - rawProgress, 3);
      setLoadPercent(Math.round(easedProgress * 100));

      if (rawProgress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        const checkReady = () => {
          if (document.readyState === "complete") {
            finishTimer = setTimeout(() => setIsLoading(false), 300);
          } else {
            window.addEventListener("load", () => {
              finishTimer = setTimeout(() => setIsLoading(false), 300);
            }, { once: true });
          }
        };
        checkReady();
      }
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      if (finishTimer) clearTimeout(finishTimer);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        if (visibleEntries.length > 0) {
          const topMost = visibleEntries.sort((a, b) => a.target.getBoundingClientRect().top - b.target.getBoundingClientRect().top)[0];
          if (topMost?.target.id) {
            setActiveSectionId(topMost.target.id as SectionId);
          }
        }
      },
      {
        threshold: [0.1, 0.2, 0.4, 0.6, 0.8],
        rootMargin: "-48% 0px -48% 0px",
      }
    );

    sections.forEach((section) => {
      const node = document.getElementById(section.id);
      if (node) observer.observe(node);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePointerMove = (event: PointerEvent) => {
      const x = event.clientX / window.innerWidth - 0.5;
      const y = event.clientY / window.innerHeight - 0.5;
      const multipliers = [0.45, 0.85, 1.25];

      blobRefs.current.forEach((blob, index) => {
        if (!blob) return;
        const amount = 34 * multipliers[index];
        blob.style.transform = `translate3d(${x * amount}px, ${y * amount}px, 0)`;
      });
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, []);

  return (
    <div className="cinema-root">

      <div className="cinema-grain" aria-hidden="true" />

      <div className="cinema-mesh" aria-hidden="true">
        <div
          ref={(node) => {
            blobRefs.current[0] = node;
          }}
          className="cinema-blob cinema-blob-one"
        />
        <div
          ref={(node) => {
            blobRefs.current[1] = node;
          }}
          className="cinema-blob cinema-blob-two"
        />
        <div
          ref={(node) => {
            blobRefs.current[2] = node;
          }}
          className="cinema-blob cinema-blob-three"
        />
      </div>


      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="cinema-loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: "-8%" }}
            transition={{ duration: reduceMotion ? 0.1 : 0.65, ease: EASE }}
          >
            <div className="cinema-loader-orb" />
            <div className="cinema-loader-count">
              {String(loadPercent).padStart(2, "0")}
            </div>
            <div className="cinema-loader-status">Calibrating signal</div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="cinema-header">
        <button
          type="button"
          className="cinema-logo"
          onClick={() => navigateToSection("home")}
          data-cursor="interactive"
          aria-label="Go to home"
        >
          <Image
            src="/Logo.png"
            alt="PK Logo"
            width={160}
            height={90}
            className="cinema-logo-image"
            unoptimized
          />
        </button>

        <div className="cinema-header-actions">
          <a
            href="/Prashant_Resume.pdf?v=4"
            download="Prashant_Resume.pdf"
            className="cinema-resume"
            data-cursor="interactive"
            aria-label="Download resume"
          >
            <Download size={15} />
            <span>Resume</span>
          </a>

          <button
            type="button"
            className="cinema-menu-button"
            onClick={() => setMenuOpen(true)}
            data-cursor="interactive"
            aria-label="Open menu"
          >
            <span>Menu</span>
            <span className="cinema-menu-button-icon">
              <Menu size={18} />
            </span>
          </button>
        </div>
      </header>

      <motion.div
        className="cinema-nav-overlay"
        initial={false}
        animate={{
          clipPath: menuOpen ? "circle(150% at 95% 5%)" : "circle(0% at 95% 5%)",
        }}
        transition={{ duration: reduceMotion ? 0.1 : 0.85, ease: EASE }}
        style={{ pointerEvents: menuOpen ? "auto" : "none" }}
        aria-hidden={!menuOpen}
      >
          <button
            type="button"
            className="cinema-nav-close"
            onClick={() => setMenuOpen(false)}
            data-cursor="interactive"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>

          <nav className="cinema-nav-links" aria-label="Main navigation">
            {sections.map((section, index) => (
              <button
                key={section.id}
                type="button"
                className="cinema-nav-link"
                onClick={() => navigateToSection(section.id)}
                onMouseEnter={() => setHoveredPreview(section.preview)}
                data-cursor="interactive"
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                {section.label}
              </button>
            ))}
            <a
              href="/Prashant_Resume.pdf?v=4"
              download="Prashant_Resume.pdf"
              className="cinema-nav-link cinema-nav-link-small"
              data-cursor="interactive"
            >
              <span>CV</span>
              Resume
            </a>
          </nav>

          <div className="cinema-nav-preview" aria-hidden="true">
            <Image
              src={hoveredPreview}
              alt=""
              fill
              sizes="(max-width: 768px) 42vw, 300px"
              className="cinema-nav-preview-image"
            />
          </div>
        </motion.div>

        <main id="main-content" className="cinema-scroll-stage">
          <HeroSection navigateTo={navigateToSection} />
          <AboutSection />
          <WorkSection />
          <CertificatesSection />
          <ContactSection navigateTo={navigateToSection} />
        </main>

        <div className="cinema-progress" aria-hidden="true">
          <span>{sectionNumber}</span>
          <span className="cinema-progress-line" />
          <span>{String(sections.length).padStart(2, "0")}</span>
        </div>

        <div className="cinema-section-dots" aria-label="Section navigation">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              className={activeSectionId === section.id ? "is-active" : ""}
              onClick={() => navigateToSection(section.id)}
              data-cursor="interactive"
              aria-label={`Go to ${section.label}`}
            />
          ))}
        </div>
    </div>
  );
}
