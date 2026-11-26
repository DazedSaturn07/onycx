import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import ResumeDownload from "@/components/ResumeDownload";
import Hero from "@/components/sections/Hero";
import ScrollEffects from "@/components/ScrollEffects";
import { CinematicFooter } from "@/components/ui/motion-footer";
import GitHubContributions from "@/components/GitHubContributions";
import Navigation from "@/components/Navigation";
import CertificateCarousel from "@/components/CertificateCarousel";
import ScrollHighlight from "@/components/ScrollHighlight";
import Capabilities from "@/components/Capabilities";
import FeatureCarousel from "@/components/ui/feature-carousel";
import AetherSpineBackground from "@/components/ui/aether-spine-background";

export default function PortfolioPage() {
  return (
    <>
      <ScrollEffects />
      <Navigation />
      <main id="main-content" className="portfolio-home">
        <Hero />

        <section id="about" className="portfolio-section portfolio-about" aria-labelledby="about-heading">
          <h2 id="about-heading" className="sr-only">About Prashant Yadav</h2>
          <div className="portfolio-about-topline">
            <p className="portfolio-section-kicker">01 / About</p>
          </div>
          <div className="portfolio-section-inner portfolio-about-inner">
          <div className="portfolio-about-identity" data-reveal data-reveal-side="left">
            <div className="portfolio-about-portrait">
              <Image src="/images/about-portrait.webp" alt="Prashant Yadav in profile, looking upwards" fill sizes="(max-width: 760px) 90vw, 46vw" loading="eager" className="portfolio-about-image" />
            </div>
            <span className="portfolio-about-availability">Open to opportunities</span>
          </div>
          <div className="portfolio-about-copy" data-reveal data-reveal-side="right">
            <p className="portfolio-about-lead">I&apos;m Prashant Yadav, a Chandigarh University graduate looking for my next role in data analytics.</p>
            <div className="portfolio-about-story">
              <p><ScrollHighlight text="I like taking a messy dataset, checking what is happening in the numbers, and putting together clear reports people can actually use." /></p>
              <p><ScrollHighlight text="Outside analytics, I build websites and UI templates using AI-assisted workflows, try out ideas in code, and learn by shipping things." /></p>
            </div>
            <p className="portfolio-about-invitation">Open to full-time data analyst roles, freelance builds, and practical collaborations.</p>
            <div className="portfolio-about-actions">
              <ResumeDownload />
              <a href="#contact" className="portfolio-text-link">Get in touch <ArrowUpRight size={16} aria-hidden="true" /></a>
            </div>
          </div>
          </div>
          <dl className="portfolio-about-details">
            <div><dt>Education</dt><dd>Chandigarh University graduate</dd></div>
            <div><dt>Main focus</dt><dd>Data analytics</dd></div>
            <div><dt>Also building</dt><dd>Websites &amp; templates (AI-assisted)</dd></div>
          </dl>
        </section>

        <section id="signature" className="portfolio-signature-section" aria-label="Prashant signature">
          <div className="portfolio-signature-stage">
            <p className="portfolio-signature-name">
              <span className="portfolio-signature-base">Prashant</span>
              <span className="portfolio-signature-ink" aria-hidden="true">Prashant</span>
            </p>
          </div>
        </section>

        <section id="work" className="portfolio-section portfolio-work" aria-labelledby="work-heading">
          <AetherSpineBackground />
          <div className="portfolio-section-inner">
            <div className="portfolio-heading">
              <p className="portfolio-section-kicker" data-reveal data-reveal-side="left">02 / Selected work</p>
              <div data-reveal>
                <h2 id="work-heading">My<br /><em>projects.</em></h2>
                <span>Dashboards, machine learning models, and websites built around real datasets and clear questions.</span>
              </div>
            </div>
            <div className="selected-work-stage">
              <FeatureCarousel />
            </div>

            <div className="featured-project-footer">
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
