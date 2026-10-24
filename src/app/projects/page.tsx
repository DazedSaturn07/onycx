import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import Navigation from "@/components/Navigation";
import ProjectsHero from "@/components/sections/ProjectsHero";
import ScrollEffects from "@/components/ScrollEffects";
import { ProjectShowcase } from "@/components/ProjectShowcase";
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

export default function ProjectsPage() {
  return (
    <>
      <ScrollEffects />
      <Navigation />
      <main id="main-content" className="project-index">
        <ProjectsHero />

        <section id="analytics" className="portfolio-section project-catalog-section" aria-labelledby="analytics-projects-title">
          <div className="portfolio-heading">
            <p className="portfolio-section-kicker" data-reveal data-reveal-side="left">01 / Core discipline</p>
            <div data-reveal data-reveal-side="right">
              <h2 id="analytics-projects-title">Data &<br /><em>business insight.</em></h2>
              <span>Job-market quality, lending processes, airline operations and customer studies. Explore each project’s source-grounded interactive dashboard.</span>
            </div>
          </div>
          <ProjectShowcase projects={analyticsProjects} title="Data and business analysis projects" />
        </section>

        <section id="machine-learning" className="portfolio-section project-catalog-section" aria-labelledby="machine-learning-title">
          <div className="portfolio-heading">
            <p className="portfolio-section-kicker" data-reveal data-reveal-side="left">02 / Applied machine learning</p>
            <div data-reveal data-reveal-side="right">
              <h2 id="machine-learning-title">Models with<br /><em>a purpose.</em></h2>
              <span>Computer vision and telecom churn studies, with model choices, evaluation methods and limits stated explicitly.</span>
            </div>
          </div>
          <ProjectShowcase projects={machineLearningProjects} title="Machine learning projects" />
        </section>

        <section id="ai-software" className="portfolio-section project-catalog-section" aria-labelledby="ai-software-title">
          <div className="portfolio-heading">
            <p className="portfolio-section-kicker" data-reveal data-reveal-side="left">03 / Product engineering</p>
            <div data-reveal data-reveal-side="right">
              <h2 id="ai-software-title">Useful ideas,<br /><em>made tangible.</em></h2>
              <span>AI-assisted software work is labelled clearly and kept distinct from the self-authored analytics and machine-learning projects.</span>
            </div>
          </div>
          <ProjectShowcase projects={productProjects} title="Product engineering projects" />
        </section>

        <section id="web-experiences" className="portfolio-section portfolio-work project-web-section" aria-labelledby="web-experiences-title">
          <div className="portfolio-heading">
            <p className="portfolio-section-kicker" data-reveal data-reveal-side="left">04 / Interface work</p>
            <div data-reveal data-reveal-side="right">
              <h2 id="web-experiences-title">Digital<br /><em>experiences.</em></h2>
              <span>Selected storefronts, studios, and product interfaces. Each project links to its live site; repository descriptions remain focused on the user-facing work.</span>
            </div>
          </div>
          <ProjectShowcase projects={webProjects} title="Web experience projects" />
          <div className="project-index-back"><Link href="/">Back to the introduction <ArrowUpRight size={15} aria-hidden="true" /></Link></div>
        </section>
        <CinematicFooter />
      </main>
    </>
  );
}
