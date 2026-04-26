import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";

const stats = [
  { label: "Years Experience", value: "02" },
  { label: "Data Projects", value: "15+" },
  { label: "Client Satisfaction", value: "100%" },
];

const capabilities = [
  "Data Analysis", "Python", "SQL", "Power BI",
  "Machine Learning", "Web Experience", "AI Integration", "React", "Firebase / Supabase", "SaaS"
];

export function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null);

  /* ── scroll-linked outro: fade + push down as work arrives ── */
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const opacity = useTransform(scrollYProgress, [0, 0.55, 1], [1, 1, 0]);
  const y       = useTransform(scrollYProgress, [0, 0.55, 1], [0, 0, 120]);
  const filter  = useTransform(scrollYProgress, [0, 0.55, 1], ["blur(0px)", "blur(0px)", "blur(12px)"]);

  return (
    <motion.section
      id="about"
      ref={sectionRef}
      className="cinema-section cinema-about-section"
      style={{ opacity, y, filter }}
    >
      <div className="cinema-section-inner cinema-about">
        <div className="cinema-about-copy">
          <p className="cinema-kicker">About / Results over noise</p>
          <h2 className="cinema-display-title">
            Builder of <span className="cinema-outline">data intelligence</span>
          </h2>
          <p className="cinema-about-text">
            I specialize in analytics, machine learning, and AI-driven
            automation. The work sits where clean data pipelines, sharp
            visualization, and practical decision systems meet.
          </p>
          <p className="cinema-about-text is-muted">
            Computer Science graduate from Chandigarh University with a bias for
            clear dashboards, useful models, and modern interfaces that feel
            alive without slowing people down.
          </p>

          <div className="cinema-stat-row">
            {stats.map((stat) => (
              <div className="cinema-stat" key={stat.label}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>

          <div className="cinema-capabilities" aria-label="Capabilities">
            {capabilities.map((capability) => (
              <span key={capability}>{capability}</span>
            ))}
          </div>
        </div>

        <div className="cinema-about-media" data-cursor="interactive">
          <div className="cinema-about-glow" aria-hidden="true" />
          <Image
            src="/photo.png"
            alt="Prashant Kumar Yadav"
            fill
            sizes="(max-width: 768px) 76vw, 34vw"
            className="cinema-about-image"
          />
        </div>
      </div>
    </motion.section>
  );
}
