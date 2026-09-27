import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import Navigation from "@/components/Navigation";
import ScrollEffects from "@/components/ScrollEffects";
import ProjectCaseStudy from "@/components/ProjectCaseStudy";
import { CinematicFooter } from "@/components/ui/motion-footer";
import { projects as webProjects } from "@/data/portfolio";
import { analyticsProjects, machineLearningProjects, productProjects } from "@/data/project-catalog";
import { siteUrl } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Projects — Data Analytics, Machine Learning & Digital Products",
  description: "Selected work by Prashant Yadav across retail analytics, customer behaviour, applied machine learning, AI-assisted software, and web experiences.",
  alternates: { canonical: "/projects" },
  openGraph: {
    title: "Projects — Prashant Yadav",
    description: "Retail analytics, customer behaviour, applied machine learning, AI-assisted software, and web experiences.",
    url: new URL("/projects", siteUrl),
    type: "website",
  },
};

const projectIndex = [
  ["Retail & customer analytics", "#analytics"],
  ["Machine learning", "#machine-learning"],
  ["AI-assisted software", "#ai-software"],
  ["Web experiences", "#web-experiences"],
] as const;

export default function ProjectsPage() {
  return (
    <>
      <ScrollEffects />
      <Navigation />
      <main id="main-content" className="project-index">
        <section id="top" className="project-index-hero" aria-labelledby="project-index-title">
          <div className="project-index-hero-inner">
            <p className="shatter-kicker"><span />Selected work · 2026</p>
            <h1 id="project-index-title">Curiosity,<br /><em>put to work.</em></h1>
            <p className="project-index-intro">Analytics is the through line. These projects move from a business question to a clear, evidence-led story; product and web work sits alongside it.</p>
            <a className="project-index-scroll" href="#analytics">Explore the work <ArrowDown size={15} aria-hidden="true" /></a>
            <div className="project-index-hero-orbit" aria-hidden="true"><span /><i /><b /></div>
            <div className="project-index-index" aria-hidden="true"><span>DATA</span><span>PRODUCT</span><span>WEB</span></div>
          </div>
        </section>

        <nav className="project-index-nav" aria-label="Project categories">
          {projectIndex.map(([label, href], index) => (
            <a key={href} href={href}><span>0{index + 1}</span>{label}<ArrowUpRight size={14} aria-hidden="true" /></a>
          ))}
        </nav>

        <section id="analytics" className="portfolio-section project-catalog-section" aria-labelledby="analytics-projects-title">
          <div className="portfolio-heading">
            <p className="portfolio-section-kicker" data-reveal data-reveal-side="left">01 / Core discipline</p>
            <div data-reveal data-reveal-side="right">
              <h2 id="analytics-projects-title">Retail &<br /><em>customer insight.</em></h2>
              <span>Different business questions across transaction, customer, and order data. Methods and figures are grounded in each repository.</span>
            </div>
          </div>
          <div className="project-story-stack">
            {analyticsProjects.map((project, index) => <ProjectCaseStudy key={project.id} project={project} index={index} stacked />)}
          </div>
        </section>

        <section id="machine-learning" className="portfolio-section project-catalog-section" aria-labelledby="machine-learning-title">
          <div className="portfolio-heading">
            <p className="portfolio-section-kicker" data-reveal data-reveal-side="left">02 / Applied machine learning</p>
            <div data-reveal data-reveal-side="right">
              <h2 id="machine-learning-title">Models with<br /><em>a purpose.</em></h2>
              <span>A computer-vision project that makes its model flow and evaluation claim explicit.</span>
            </div>
          </div>
          <div className="project-case-list">
            {machineLearningProjects.map((project, index) => <ProjectCaseStudy key={project.id} project={project} index={index} />)}
          </div>
        </section>

        <section id="ai-software" className="portfolio-section project-catalog-section" aria-labelledby="ai-software-title">
          <div className="portfolio-heading">
            <p className="portfolio-section-kicker" data-reveal data-reveal-side="left">03 / Product engineering</p>
            <div data-reveal data-reveal-side="right">
              <h2 id="ai-software-title">Useful ideas,<br /><em>made tangible.</em></h2>
              <span>AI-assisted software work is labelled clearly and kept distinct from the self-authored analytics and machine-learning projects.</span>
            </div>
          </div>
          <div className="project-case-list">
            {productProjects.map((project, index) => <ProjectCaseStudy key={project.id} project={project} index={index} />)}
          </div>
        </section>

        <section id="web-experiences" className="portfolio-section portfolio-work project-web-section" aria-labelledby="web-experiences-title">
          <div className="portfolio-heading">
            <p className="portfolio-section-kicker" data-reveal data-reveal-side="left">04 / Interface work</p>
            <div data-reveal data-reveal-side="right">
              <h2 id="web-experiences-title">Digital<br /><em>experiences.</em></h2>
              <span>Selected storefronts, studios, and product interfaces. Each project links to its live site; repository descriptions remain focused on the user-facing work.</span>
            </div>
          </div>
          <div className="portfolio-project-grid">
            {webProjects.map((project, index) => (
              <article key={project.id} className={"portfolio-project-card" + (index === 0 ? " is-featured" : "")} data-reveal data-reveal-side={index % 2 === 0 ? "left" : "right"}>
                <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="portfolio-project-image-wrap" aria-label={"Visit " + project.title}>
                  <span className="project-window-bar" aria-hidden="true"><span className="project-window-dots"><i /><i /><i /></span><span>{new URL(project.liveUrl).hostname}</span><ArrowUpRight size={14} /></span>
                  <div className="project-preview"><Image src={project.image} alt={project.title + " website preview"} fill sizes="(max-width: 760px) 92vw, (max-width: 1100px) 48vw, 65vw" className="portfolio-project-image" /></div>
                  <span className="portfolio-project-open">View live site <ArrowUpRight size={16} aria-hidden="true" /></span>
                </a>
                <div className="portfolio-project-details">
                  <div className="portfolio-project-meta"><span>{String(index + 1).padStart(2, "0")} / {project.category}</span><span>{project.year}</span></div>
                  <h3><a href={project.liveUrl} target="_blank" rel="noopener noreferrer">{project.title}<ArrowUpRight aria-hidden="true" /></a></h3>
                  <p>{project.summary}</p>
                  <div className="portfolio-project-bottom"><span>{project.role}</span><ul aria-label={project.title + " technologies"}>{project.tech.map((technology) => <li key={technology}>{technology}</li>)}</ul></div>
                </div>
              </article>
            ))}
          </div>
          <div className="project-index-back"><Link href="/">Back to the introduction <ArrowUpRight size={15} aria-hidden="true" /></Link></div>
        </section>
        <CinematicFooter />
      </main>
    </>
  );
}
