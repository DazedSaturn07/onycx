import { ArrowDown } from "lucide-react";
import DataRain from "@/components/ui/data-rain";

export default function ProjectsHero() {
  return (
    <section
      id="top"
      className="projects-hero"
      aria-labelledby="project-index-title"
    >
      <DataRain
        fullscreen={false}
        count={1100}
        flowSpeed={0.6}
        palette={{ calm: "#8eb7c9", mid: "#bb9f75", hot: "#f1dac0" }}
      />
      <div className="projects-hero-topline project-hero-reveal">
        <span>Projects / 2026</span>
        <span>Prashant Yadav</span>
      </div>
      <div className="projects-hero-intro project-hero-reveal">
        <p className="portfolio-section-kicker">Project archive</p>
        <h1 id="project-index-title">
          My work,
          <br />
          <em>all in one place.</em>
        </h1>
        <p>
          Data analytics is my main focus. Alongside it, I work on machine
          learning models and build websites with AI-assisted workflows.
        </p>
      </div>
      <div className="projects-hero-word" aria-hidden="true">
        WORK
      </div>
      <div className="projects-hero-side-note project-hero-reveal">
        <span>Fields</span>
        <p>Data · ML · Web</p>
        <span>14 GitHub projects + 6 live sites</span>
      </div>
      <div className="projects-hero-footer project-hero-reveal">
        <a href="#analytics">
          Jump to projects <ArrowDown size={15} aria-hidden="true" />
        </a>
        <nav aria-label="Project disciplines">
          <a href="#analytics">Analytics</a>
          <a href="#supply-chain">Supply chain</a>
          <a href="#machine-learning">Machine learning</a>
          <a href="#web-experiences">Websites</a>
        </nav>
      </div>
    </section>
  );
}
