import { ArrowDown, ArrowUpRight } from "lucide-react";

export default function Hero() {
  return (
    <section id="top" className="shatter-hero relative" aria-labelledby="hero-title">
      {/* Optimized Custom Mesh Gradient Background */}
      <div className="absolute inset-0 -z-10 bg-[#020202] overflow-hidden"
           style={{
             backgroundImage: `
               radial-gradient(circle at 60% 30%, rgba(255, 94, 0, 0.15) 0%, transparent 60%),
               radial-gradient(ellipse at 10% 80%, rgba(255, 42, 0, 0.12) 0%, transparent 60%),
               radial-gradient(circle at 90% 10%, rgba(255, 59, 0, 0.1) 0%, transparent 50%)
             `
           }}>

        {/* Delicate elliptical orbit lines */}
        <div className="absolute top-1/2 left-1/2 w-[120%] md:w-[80%] aspect-[2/1] -translate-x-1/2 -translate-y-1/2 border-[0.5px] border-white/10 rounded-[100%] rotate-[-15deg]" />
        <div className="absolute top-1/2 left-1/2 w-[110%] md:w-[75%] aspect-[2/1] -translate-x-1/2 -translate-y-1/2 border-[0.5px] border-white/10 rounded-[100%] rotate-[-18deg]" />

        {/* Noise/Grain overlay for professional texture (Optimized: removed mix-blend-overlay) */}
        <div
          className="absolute inset-0 opacity-[0.15] pointer-events-none mix-blend-soft-light"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
        />
      </div>

      <div className="shatter-hero-copy">
        <div className="shatter-hero-content">
          <p className="shatter-kicker"><span />Data analyst & machine learning practitioner</p>
          <h1 id="hero-title" className="shatter-title">Prashant<span>Yadav</span></h1>
          <p className="shatter-intro">I turn real-world data into clear analysis, useful recommendations, and digital experiences that make sense.</p>
          <div className="shatter-actions"><a href="#work" className="shatter-button shatter-button-solid">Selected work <ArrowDown size={17} aria-hidden="true" /></a><a href="#contact" className="shatter-button">Start a conversation <ArrowUpRight size={17} aria-hidden="true" /></a></div>
        </div>
      </div>
      <p className="shatter-count"><span>01</span><b>/</b>06</p>
      <p className="shatter-footer-label">India <i>Available worldwide</i></p>
      <a className="shatter-scroll" href="#about">Scroll to explore <ArrowDown size={14} aria-hidden="true" /></a>
      <div className="shatter-word-field" aria-hidden="true">PORTFOLIO</div>
    </section>
  );
}
