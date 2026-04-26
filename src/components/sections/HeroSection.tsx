import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { ArrowDown, ArrowUpRight } from "lucide-react";

export type SectionId = "home" | "about" | "work" | "certificates" | "contact";

interface HeroSectionProps {
  navigateTo: (id: SectionId) => void;
}

export function HeroSection({ navigateTo }: HeroSectionProps) {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 600], [1, 0]);
  const y = useTransform(scrollY, [0, 600], [0, 120]);
  const filter = useTransform(scrollY, [0, 600], ["blur(0px)", "blur(15px)"]);

  return (
    <motion.section 
      id="home" 
      className="cinema-section cinema-hero-section"
      style={{ opacity, y, filter }}
    >
      <div className="cinema-section-inner cinema-hero">
        <div className="cinema-hero-copy">
          <p className="cinema-kicker">Data analyst / Vibe coder / India</p>
          <h1 className="cinema-hero-title">
            <span>Prashant</span>
            <span className="cinema-outline">Yadav</span>
          </h1>
          <p className="cinema-hero-text">
            Transforming raw data into actionable business insight with Python,
            SQL, Power BI, machine learning, and AI-shaped web experiences.
          </p>
          <div className="cinema-hero-actions">
            <button
              type="button"
              onClick={() => navigateTo("work")}
              className="cinema-primary-link"
              data-cursor="interactive"
            >
              View projects
              <ArrowDown size={18} />
            </button>
            <button
              type="button"
              onClick={() => navigateTo("contact")}
              className="cinema-secondary-link"
              data-cursor="interactive"
            >
              Contact
              <ArrowUpRight size={17} />
            </button>
          </div>
        </div>

        <div className="cinema-hero-portrait" aria-hidden="true">
          <Image
            src="/pics1.avif"
            alt=""
            fill
            sizes="(max-width: 768px) 70vw, 38vw"
            priority
            className="cinema-hero-portrait-image"
          />
        </div>
      </div>
    </motion.section>
  );
}
