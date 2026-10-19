import { ArrowDown } from "lucide-react";
import DataRain from "@/components/ui/data-rain";

export default function ProjectsHero() {
  return (
    <section id="top" className="projects-hero" aria-labelledby="project-index-title">
      <DataRain fullscreen={false} count={1100} flowSpeed={0.6} palette={{ calm: "#8eb7c9", mid: "#bb9f75", hot: "#f1dac0" }} />
      <div className="projects-hero-topline project-hero-reveal">
        <span>Selected projects / 2026</span><span>Prashant Yadav</span>
      </div>
      <div className="projects-hero-intro project-hero-reveal">
        <p className="portfolio-section-kicker">The work, in perspective</p>
        <h1 id="project-index-title">Questions explored.<br /><em>Ideas brought to life.</em></h1>
        <p>Data analytics is my main focus. Alongside it, I explore machine learning and build digital experiences with AI-assisted development.</p>
      </div>
      <div className="projects-hero-word" aria-hidden="true">WORK</div>
      <div className="projects-hero-side-note project-hero-reveal"><span>Two ways of thinking.</span><p>One curiosity.</p><span>Evidence &amp; imagination.</span></div>
      <div className="projects-hero-footer project-hero-reveal">
        <a href="#analytics">Explore the work <ArrowDown size={15} aria-hidden="true" /></a>
        <nav aria-label="Project disciplines"><a href="#analytics">Analytics</a><a href="#machine-learning">Machine learning</a><a href="#web-experiences">Web experiences</a></nav>
      </div>
    </section>
  );
}
