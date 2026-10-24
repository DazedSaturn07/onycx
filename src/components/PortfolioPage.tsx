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
import Capabilities from "@/components/Capabilities";
import FeatureCarousel from "@/components/ui/feature-carousel";
import WorkLight from "@/components/ui/work-light";
export default function PortfolioPage() {
  return (
    <>
      <ScrollEffects />
      <Navigation />
      <main id="main-content" className="portfolio-home">
        <Hero />

        <section id="about" className="portfolio-section portfolio-about" aria-labelledby="about-heading">
          <div className="portfolio-about-topline">
            <p className="portfolio-section-kicker">01 / The person behind the work</p>
            <span>Analytics first. Always exploring.</span>
          </div>
          <div className="portfolio-section-inner portfolio-about-inner">
          <div className="portfolio-about-identity" data-reveal data-reveal-side="left">
            <div className="portfolio-about-portrait">
              <Image src="/images/about-portrait.png" alt="Prashant Yadav in profile, looking upwards" fill sizes="(max-width: 760px) 90vw, 46vw" className="portfolio-about-image" />
            </div>
            <span className="portfolio-about-availability">Open to opportunities</span>
            <h2 id="about-heading">PRASHANT<br /><span>YADAV</span></h2>
            <p>Data analyst.<br />Curious by nature.</p>
          </div>
          <div className="portfolio-about-copy" data-reveal data-reveal-side="right">
            <p className="portfolio-about-lead">I&apos;m Prashant Yadav, a Chandigarh University graduate looking for my next opportunity in data analytics.</p>
            <div className="portfolio-about-story">
              <p><ScrollHighlight text="I like working through a question, finding the story in the data, and making the answer easy to understand." /></p>
              <p><ScrollHighlight text="On the creative side, I build websites and templates with AI-assisted development, experiment with design, and learn by making." /></p>
            </div>
            <p className="portfolio-about-invitation">Open to freelance projects, creative opportunities, and building something together.</p>
            <div className="portfolio-about-actions">
              <a href="/Prashant_res.pdf" download="Prashant_Yadav_Resume.pdf" className="portfolio-text-link">Download résumé <Download size={16} aria-hidden="true" /></a>
              <a href="#contact" className="portfolio-text-link">Let&apos;s connect <ArrowUpRight size={16} aria-hidden="true" /></a>
            </div>
          </div>
          </div>
          <dl className="portfolio-about-details">
            <div><dt>Education</dt><dd>Chandigarh University graduate</dd></div>
            <div><dt>Main focus</dt><dd>Data analytics</dd></div>
            <div><dt>Creative practice</dt><dd>AI-assisted websites &amp; templates</dd></div>
          </dl>
        </section>

        <section id="signature" className="portfolio-signature-section" aria-label="Prashant signature">
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
            <div className="selected-work-stage">
              <WorkLight />
              <FeatureCarousel />
            </div>

            <div className="featured-project-footer">
              <span>Data analytics · machine learning · thoughtful software</span>
              <Link href="/projects">Explore all projects <ArrowUpRight size={16} aria-hidden="true" /></Link>
            </div>
          </div>
        </section>

        <Capabilities />

        <GitHubContributions />

        <CertificateCarousel />

        <CinematicFooter />
      </main>
    </>
  );
}
