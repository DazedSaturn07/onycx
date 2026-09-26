import Image from "next/image";
import { ArrowUpRight, Download } from "lucide-react";
import Hero from "@/components/sections/Hero";
import ScrollEffects from "@/components/ScrollEffects";
import { CinematicFooter } from "@/components/ui/motion-footer";
import GitHubContributions from "@/components/GitHubContributions";
import Navigation from "@/components/Navigation";
import CertificateCarousel from "@/components/CertificateCarousel";
import ScrollHighlight from "@/components/ScrollHighlight";
import GlowCursor from "@/components/GlowCursor";
import { capabilityGroups, projects } from "@/data/portfolio";

export default function PortfolioPage() {
  return (
    <>
      <GlowCursor style={{ position: "fixed", inset: 0, width: "100vw", height: "100dvh", zIndex: 9999, pointerEvents: "none" }} color="#e43412" secondaryColor="#141615" trailLength={40} trailWidth={8} trailTaper={0.8} followSpeed={0.1} glowIntensity={0.8} glowSpread={1.2} hotspot={0.65} brightness={1.25} opacity={1} pulseSpeed={1.1} noiseStrength={0.035} idleFade idleTimeout={700} fadeDuration={900} blendMode="normal" />
      <ScrollEffects />
      <Navigation />
      <main id="main-content">
        <Hero />

        <section id="about" className="portfolio-section portfolio-about" aria-labelledby="about-heading">
          <div className="portfolio-about-photo" data-reveal data-reveal-side="left">
            <Image src="/photo.png" alt="Prashant Yadav" fill sizes="(max-width: 760px) 84vw, (max-width: 1100px) 42vw, 520px" className="portfolio-about-image" />
            <span className="portfolio-about-stamp" aria-hidden="true">Based in India<br />Working everywhere</span>
          </div>
          <div className="portfolio-about-copy" data-reveal data-reveal-side="right">
            <p className="portfolio-section-kicker">01 / A little about me</p>
            <h2 id="about-heading">Curiosity,<br />made <em>useful.</em></h2>
            <p><ScrollHighlight text="I bring data analysis, applied machine learning, and frontend craft together to make complex ideas clearer and easier to act on." /></p>
            <div className="portfolio-about-actions">
              <a href="/Prashant_res.pdf" download className="portfolio-text-link">Download résumé <Download size={16} aria-hidden="true" /></a>
              <span>Data · Products · Experiences</span>
            </div>
            <div className="portfolio-about-signature">
              <span className="portfolio-signature-name">Prashant Yadav</span>
              <span>Always curious. Always creating.</span>
            </div>
          </div>
        </section>

        <section id="work" className="portfolio-section portfolio-work" aria-labelledby="work-heading">
          <div className="portfolio-heading">
            <p className="portfolio-section-kicker" data-reveal data-reveal-side="left">02 / Selected work</p>
            <div data-reveal data-reveal-side="right">
              <h2 id="work-heading">Work with<br /><em>intent.</em></h2>
              <span>Selected digital work shaped by useful ideas, considered systems, and the people who use them.</span>
            </div>
          </div>
          <div className="portfolio-project-grid">
            {projects.map((project, index) => (
              <article key={project.id} className={`portfolio-project-card${index === 0 ? " is-featured" : ""}`} data-reveal data-reveal-side={index % 2 === 0 ? "left" : "right"}>
                <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="portfolio-project-image-wrap" aria-label={`Visit ${project.title}`}>
                  <span className="project-window-bar" aria-hidden="true"><span className="project-window-dots"><i /><i /><i /></span><span>{new URL(project.liveUrl).hostname}</span><ArrowUpRight size={14} /></span>
                  <div className="project-preview"><Image src={project.image} alt={`${project.title} website preview`} fill sizes="(max-width: 760px) 92vw, (max-width: 1100px) 48vw, 65vw" className="portfolio-project-image" /></div>
                  <span className="portfolio-project-open">View live site <ArrowUpRight size={16} aria-hidden="true" /></span>
                </a>
                <div className="portfolio-project-details">
                  <div className="portfolio-project-meta"><span>{String(index + 1).padStart(2, "0")} / {project.category}</span><span>{project.year}</span></div>
                  <h3><a href={project.liveUrl} target="_blank" rel="noopener noreferrer">{project.title}<ArrowUpRight aria-hidden="true" /></a></h3>
                  <p>{project.summary}</p>
                  <div className="portfolio-project-bottom">
                    <span>{project.role}</span>
                    <ul aria-label={`${project.title} technologies`}>{project.tech.map((technology) => <li key={technology}>{technology}</li>)}</ul>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="capabilities" className="portfolio-section portfolio-capabilities" aria-labelledby="capabilities-heading">
          <div className="portfolio-heading"><p className="portfolio-section-kicker" data-reveal data-reveal-side="left">03 / Capabilities</p><div data-reveal data-reveal-side="right"><h2 id="capabilities-heading">Useful<br /><em>systems.</em></h2><span><ScrollHighlight text="From the first question to the final interface, I focus on work that is clear, maintainable, and ready to use." /></span></div></div>
          <div className="portfolio-capability-list">
            {capabilityGroups.map((group) => (
              <article key={group.index} className="portfolio-capability" data-reveal data-reveal-side={Number(group.index) % 2 === 1 ? "left" : "right"}>
                <span className="portfolio-capability-index">{group.index}</span><h3>{group.title}</h3><p>{group.copy}</p>
                <ul>{group.skills.map((skill) => <li key={skill}>{skill}</li>)}</ul>
              </article>
            ))}
          </div>
        </section>

        <GitHubContributions />

        <section id="credentials" className="portfolio-section portfolio-credentials" aria-labelledby="credentials-heading">
          <div className="portfolio-heading"><p className="portfolio-section-kicker" data-reveal data-reveal-side="left">05 / Credentials</p><div data-reveal data-reveal-side="right"><h2 id="credentials-heading">Keep<br /><em>learning.</em></h2><span>Courses and certifications that document a steady investment in analytical and technical foundations.</span></div></div>
          <CertificateCarousel />
        </section>

        <CinematicFooter />
      </main>
    </>
  );
}
