import Image from "next/image";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import "./hero.css";

export default function Hero() {
  return (
    <section id="top" className="portrait-hero" aria-labelledby="hero-title">
      <div className="portrait-hero-light" aria-hidden="true" />
      <div className="portrait-hero-grain" aria-hidden="true" />
      <div className="portrait-hero-heading">
        <p className="portrait-hero-eyebrow hero-reveal">Prashant Yadav <span>Independent portfolio / 2026</span></p>
        <h1 id="hero-title" className="portrait-hero-name" aria-label="Prashant Yadav">
          <span className="portrait-hero-line"><span className="hero-reveal hero-reveal-name">Prashant</span></span>
          <span className="portrait-hero-line"><span className="hero-reveal hero-reveal-surname">Yadav</span></span>
        </h1>
      </div>
      <div className="portrait-hero-figure hero-reveal">
        <Image src="/images/hero-portrait.webp" alt="Prashant Yadav in a black suit, looking upward" width={900} height={1600}
          sizes="(max-width: 600px) 110vw, (max-width: 900px) 85vw, 65vw" loading="eager" fetchPriority="high" />
      </div>
      <div className="portrait-hero-copy hero-reveal">
        <p className="portrait-hero-label"><span />Data analyst &amp;<br />ML practitioner</p>
        <h2>Clear thinking.<br />Useful outcomes.</h2>
        <p className="portrait-hero-intro">Turning real-world data into insights, practical models, and thoughtful digital experiences.</p>
        <a href="#work" className="portrait-hero-work">Explore my work <span><ArrowUpRight size={18} aria-hidden="true" /></span></a>
      </div>
      <div className="portrait-hero-note hero-reveal">
        <span className="portrait-hero-note-index">01 / THE APPROACH</span>
        <p>Curiosity leads.<br />Evidence follows.</p>
        <span className="portrait-hero-disciplines">Analytics / Machine learning<br />Creative development</span>
        <a href="#contact">Let&apos;s build something <ArrowUpRight size={14} aria-hidden="true" /></a>
      </div>
      <div className="portrait-hero-footer hero-reveal">
        <p><span className="portrait-hero-location-dot" />Based in India <span className="portrait-hero-footer-secondary">/ Open to opportunities</span></p>
        <a href="#about">Scroll to discover <ArrowDown size={15} aria-hidden="true" /></a>
        <span className="portrait-hero-footer-index">DATA. DESIGN. DIRECTION.</span>
      </div>
    </section>
  );
}
