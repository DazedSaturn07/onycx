import Image from "next/image";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import "./hero.css";

export default function Hero() {
  return (
    <section id="top" className="portrait-hero" aria-labelledby="hero-title">
      <div className="portrait-hero-light" aria-hidden="true" />
      <div className="portrait-hero-grain" aria-hidden="true" />
      <div className="portrait-hero-heading">
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
        <p className="portrait-hero-eyebrow">Prashant Yadav</p>
      </div>
      <div className="portrait-hero-bottom-left hero-reveal">
        <a href="#work" className="portrait-hero-work">View my work <span><ArrowUpRight size={18} aria-hidden="true" /></span></a>
      </div>
      <div className="portrait-hero-note hero-reveal">
        <span className="portrait-hero-disciplines">Data analytics / ML<br />Web development</span>
      </div>
      <div className="portrait-hero-footer hero-reveal">
        <p><span className="portrait-hero-location-dot" />Based in India <span className="portrait-hero-footer-secondary">/ Open to opportunities</span></p>
        <a href="#about">Scroll down <ArrowDown size={15} aria-hidden="true" /></a>
        <span className="portrait-hero-footer-index">DATA · ML · WEB</span>
      </div>
    </section>
  );
}
