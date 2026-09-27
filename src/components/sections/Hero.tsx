import { ArrowDown, ArrowUpRight } from "lucide-react";

export default function Hero() {
  return (
    <section id="top" className="shatter-hero" aria-labelledby="hero-title">
      <div className="shatter-hero-copy">
        <div className="shatter-hero-content">
          <p className="shatter-kicker"><span />Data analyst & machine learning practitioner</p>
          <h1 id="hero-title" className="shatter-title">Prashant<span>Yadav</span></h1>
          <p className="shatter-intro">I turn real-world data into clear analysis, useful recommendations, and digital experiences that make sense.</p>
          <div className="shatter-actions"><a href="#work" className="shatter-button shatter-button-solid">Selected work <ArrowDown size={17} aria-hidden="true" /></a><a href="#contact" className="shatter-button">Start a conversation <ArrowUpRight size={17} aria-hidden="true" /></a></div>
        </div>
        <div className="hero-sculpture" aria-hidden="true">
          <div className="hero-sculpture-orbit" />
          <div className="hero-sculpture-core"><span>Py.</span></div>
          <span className="hero-sculpture-caption">Thoughtfully designed.<br />Purposefully built.</span>
        </div>
      </div>
      <p className="shatter-count"><span>01</span><b>/</b>06</p>
      <p className="shatter-footer-label">India <i>Available worldwide</i></p>
      <a className="shatter-scroll" href="#about">Scroll to explore <ArrowDown size={14} aria-hidden="true" /></a>
      <div className="shatter-word-field" aria-hidden="true">PORTFOLIO — 2026</div>
      <div className="shatter-light-field" aria-hidden="true" />
    </section>
  );
}
