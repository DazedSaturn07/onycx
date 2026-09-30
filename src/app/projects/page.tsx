import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import Navigation from "@/components/Navigation";
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
        <section id="top" className="relative flex min-h-[min(820px,95svh)] items-end overflow-hidden px-[clamp(1.15rem,5vw,5.2rem)] pt-[12rem] pb-[8rem] border-b border-white/10" aria-labelledby="project-index-title">
          {/* Custom Mesh Gradient Background */}
          <div className="absolute inset-0 z-0 bg-[#040404]">
            {/* Deep Crimson blob top left */}
            <div className="absolute -top-[10%] -left-[10%] w-[70vw] h-[70vw] md:w-[50vw] md:h-[50vw] rounded-full bg-[radial-gradient(circle,_#85051a_0%,_transparent_70%)] blur-[100px] mix-blend-screen opacity-90" />
            {/* Bright Silver/Grey blob bottom right */}
            <div className="absolute -bottom-[20%] -right-[10%] w-[80vw] h-[80vw] md:w-[60vw] md:h-[60vw] rounded-full bg-[radial-gradient(circle,_#d4d4d4_0%,_transparent_70%)] blur-[120px] mix-blend-screen opacity-70" />

            {/* Optional delicate elliptical orbit lines if desired for 'warp gradient' aesthetic */}
            <div className="absolute top-1/2 left-1/2 w-[120%] md:w-[80%] aspect-[2/1] -translate-x-1/2 -translate-y-1/2 border-[0.5px] border-white/10 rounded-[100%] rotate-[-15deg]" />
            <div className="absolute top-1/2 left-1/2 w-[110%] md:w-[75%] aspect-[2/1] -translate-x-1/2 -translate-y-1/2 border-[0.5px] border-white/10 rounded-[100%] rotate-[-18deg]" />

            {/* Noise/Grain overlay for professional texture */}
            <div
              className="absolute inset-0 mix-blend-overlay opacity-[0.25] pointer-events-none"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
            />
          </div>

          <div className="relative z-10 w-full max-w-[1380px] mx-auto">
            <p className="mb-6 font-bold uppercase tracking-[0.2em] text-[10px] md:text-xs opacity-80">Selected work · 2026</p>
            <h1 id="project-index-title" className="max-w-[900px] m-0 font-semibold text-[clamp(3.8rem,10vw,10.2rem)] leading-[0.88] tracking-tight text-white">
              Curiosity,<br />
              <em className="text-white italic font-serif opacity-90">put to work.</em>
            </h1>
            <p className="mt-8 max-w-[50ch] text-[clamp(1rem,1.5vw,1.35rem)] leading-relaxed text-white/70">
              Analytics is the through line. These projects move from a business question to a clear, evidence-led story; product and web work sits alongside it.
            </p>
            <a className="mt-12 inline-flex items-center gap-2 uppercase tracking-wider text-[11px] md:text-sm font-bold text-white hover:text-white/70 transition-colors" href="#analytics">
              Explore the work <ArrowDown size={16} aria-hidden="true" />
            </a>
          </div>
        </section>



        <section id="analytics" className="portfolio-section project-catalog-section" aria-labelledby="analytics-projects-title">
          <div className="portfolio-heading">
            <p className="portfolio-section-kicker" data-reveal data-reveal-side="left">01 / Core discipline</p>
            <div data-reveal data-reveal-side="right">
              <h2 id="analytics-projects-title">Retail &<br /><em>customer insight.</em></h2>
              <span>Different business questions across transaction, customer, and order data. Methods and figures are grounded in each repository.</span>
            </div>
          </div>
          <ProjectShowcase projects={analyticsProjects} title="Retail & customer insight projects" />
        </section>

        <section id="machine-learning" className="portfolio-section project-catalog-section" aria-labelledby="machine-learning-title">
          <div className="portfolio-heading">
            <p className="portfolio-section-kicker" data-reveal data-reveal-side="left">02 / Applied machine learning</p>
            <div data-reveal data-reveal-side="right">
              <h2 id="machine-learning-title">Models with<br /><em>a purpose.</em></h2>
              <span>A computer-vision project that makes its model flow and evaluation claim explicit.</span>
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
