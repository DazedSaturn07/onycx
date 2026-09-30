import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Download } from "lucide-react";
import Hero from "@/components/sections/Hero";
import ScrollEffects from "@/components/ScrollEffects";
import { CinematicFooter } from "@/components/ui/motion-footer";
import GitHubContributions from "@/components/GitHubContributions";
import Navigation from "@/components/Navigation";
import CertificateCarousel from "@/components/CertificateCarousel";
import ScrollHighlight from "@/components/ScrollHighlight";
import { capabilityGroups } from "@/data/portfolio";
import FeatureCarousel from "@/components/ui/feature-carousel";
export default function PortfolioPage() {
  return (
    <>
      <ScrollEffects />
      <Navigation />
      <main id="main-content" className="portfolio-home">
        <Hero />

        <section id="about" className="portfolio-section portfolio-about" aria-labelledby="about-heading">
          <div className="portfolio-section-inner portfolio-about-inner">
          <div className="portfolio-about-photo" data-reveal data-reveal-side="left">
            <Image src="/photo.png" alt="Prashant Yadav" fill sizes="(max-width: 760px) 84vw, (max-width: 1100px) 42vw, 520px" className="portfolio-about-image" />
            <span className="portfolio-about-stamp" aria-hidden="true">Based in India<br />Working everywhere</span>
          </div>
          <div className="portfolio-about-copy" data-reveal data-reveal-side="right">
            <p className="portfolio-section-kicker">01 / A little about me</p>
            <h2 id="about-heading">Curiosity,<br />made <em>useful.</em></h2>
            <p><ScrollHighlight text="I bring data analysis, applied machine learning, and frontend craft together to make complex ideas clearer and easier to act on." /></p>
            <div className="portfolio-about-actions">
              <a href="/Prashant_res.pdf" download="Prashant_Yadav_Resume.pdf" className="portfolio-text-link">Download résumé <Download size={16} aria-hidden="true" /></a>
              <span>Data · Products · Experiences</span>
            </div>
          </div>
          </div>
        </section>

        <section className="portfolio-signature-section" aria-label="Prashant signature">
          <div className="portfolio-signature-stage">
            <p className="portfolio-signature-kicker">The person behind the work</p>
            <p className="portfolio-signature-name">
              <span className="portfolio-signature-base">Prashant</span>
              <span className="portfolio-signature-ink" aria-hidden="true">Prashant</span>
            </p>
            <span className="portfolio-signature-caption">Always curious. Always creating.</span>
          </div>
        </section>

        <section id="work" className="portfolio-section portfolio-work" aria-labelledby="work-heading">
          <div className="portfolio-section-inner">
            <div className="portfolio-heading">
              <p className="portfolio-section-kicker" data-reveal data-reveal-side="left">02 / Selected work</p>
              <div data-reveal data-reveal-side="right">
                <h2 id="work-heading">Insight<br /><em>in practice.</em></h2>
                <span>My core work starts with a business question, follows the evidence, and makes the answer clear enough to use.</span>
              </div>
            </div>
            <FeatureCarousel />

            <div className="featured-project-footer">
              <span>Data analytics · machine learning · thoughtful software</span>
              <Link href="/projects">Explore all projects <ArrowUpRight size={16} aria-hidden="true" /></Link>
            </div>
          </div>
        </section>

        <section id="capabilities" className="portfolio-section portfolio-capabilities" aria-labelledby="capabilities-heading">
          <div className="portfolio-section-inner">
          <div className="portfolio-heading"><p className="portfolio-section-kicker" data-reveal data-reveal-side="left">03 / Capabilities</p><div data-reveal data-reveal-side="right"><h2 id="capabilities-heading">Useful<br /><em>systems.</em></h2><span><ScrollHighlight text="From the first question to the final interface, I focus on work that is clear, maintainable, and ready to use." /></span></div></div>
          <div className="portfolio-capability-list">
            {capabilityGroups.map((group) => (
              <article key={group.index} className="portfolio-capability" data-reveal data-reveal-side={Number(group.index) % 2 === 1 ? "left" : "right"}>
                <span className="portfolio-capability-index">{group.index}</span><h3>{group.title}</h3><p>{group.copy}</p>
                <ul>{group.skills.map((skill) => <li key={skill}>{skill}</li>)}</ul>
              </article>
            ))}
          </div>
          </div>
        </section>

        <GitHubContributions />

        <section id="credentials" className="portfolio-section portfolio-credentials" aria-labelledby="credentials-heading">
          <div className="portfolio-section-inner">
          <div className="portfolio-heading"><p className="portfolio-section-kicker" data-reveal data-reveal-side="left">05 / Credentials</p><div data-reveal data-reveal-side="right"><h2 id="credentials-heading">Keep<br /><em>learning.</em></h2><span>Courses and certifications that document a steady investment in analytical and technical foundations.</span></div></div>
          <CertificateCarousel />
          </div>
        </section>

        <CinematicFooter />
      </main>
    </>
  );
}
