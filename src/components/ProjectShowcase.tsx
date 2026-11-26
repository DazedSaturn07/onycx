"use client";

import React from "react";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import FlowArt, { FlowSection } from "@/components/ui/story-scroll";
import type { RepositoryProject } from "@/data/project-catalog";
import type { PortfolioProject } from "@/data/portfolio";
import { dashboardProjects } from "@/data/project-catalog";

const PALETTE = [
  { bg: "#000000", fg: "#ffffff" },
  { bg: "#F5F0E8", fg: "#000000" },
  { bg: "#1A3DE8", fg: "#ffffff" },
  { bg: "#fd5200", fg: "#ffffff" },
  { bg: "#2C4C3B", fg: "#ffffff" },
];

function isRepoProject(
  p: RepositoryProject | PortfolioProject,
): p is RepositoryProject {
  return "question" in p;
}

export function ProjectShowcase({
  projects,
  title,
}: {
  projects: (RepositoryProject | PortfolioProject)[];
  title: string;
}) {
  const content = projects.map((project, i) => {
    const color = PALETTE[i % PALETTE.length];
    const indexStr = String(i + 1).padStart(2, "0");

    if (isRepoProject(project)) {
      return (
        <FlowSection
          key={project.id}
          id={project.id}
          aria-label={project.title}
          style={{ background: color.bg, color: color.fg }}
        >
          <div className="flex justify-between items-start gap-4">
            <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mt-1">
              {indexStr} — {project.category}
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-end sm:items-center">
              {dashboardProjects.some((item) => item.id === project.id) && (
                <Link
                  href={`/projects/${project.id}/dashboard`}
                  className="flex items-center gap-1.5 uppercase tracking-wider text-[9px] md:text-[11px] font-bold hover:opacity-75 transition-opacity px-3 py-1.5 border border-current rounded-full whitespace-nowrap"
                >
                  Dashboard <ArrowUpRight size={14} />
                </Link>
              )}
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 uppercase tracking-wider text-[9px] md:text-[11px] font-bold hover:opacity-75 transition-opacity px-3 py-1.5 border border-transparent whitespace-nowrap"
              >
                Repository <ArrowUpRight size={14} />
              </a>
            </div>
          </div>
          <hr className="my-2 md:my-3.5 border-none border-t border-current opacity-30" />
          <div>
            <h2 className="text-[clamp(1.85rem,3.6vw,3.5rem)] font-bold leading-[0.95] uppercase tracking-tight">
              {project.title}
            </h2>
          </div>
          <hr className="my-2 md:my-3.5 border-none border-t border-current opacity-30" />

          <div className="flex flex-col md:flex-row gap-4 md:gap-7">
            <div className="flex-1">
              <p className="mb-1 text-[10px] md:text-xs font-bold uppercase tracking-wider">
                Business question
              </p>
              <p className="text-[clamp(0.82rem,0.98vw,0.96rem)] leading-relaxed opacity-75">
                {project.question}
              </p>
            </div>
            <div className="flex-1">
              <p className="mb-1 text-[10px] md:text-xs font-bold uppercase tracking-wider">
                Approach
              </p>
              <p className="text-[clamp(0.82rem,0.98vw,0.96rem)] leading-relaxed opacity-75">
                {project.approach}
              </p>
            </div>
            <div className="flex-1">
              <p className="mb-1 text-[10px] md:text-xs font-bold uppercase tracking-wider">
                Technologies
              </p>
              <p className="text-[clamp(0.82rem,0.98vw,0.96rem)] leading-relaxed opacity-75">
                {project.technologies.join(", ")}
              </p>
            </div>
          </div>

          <hr className="my-2 md:my-3 border-none border-t border-current opacity-30 hidden md:block" />

          <div className="mt-auto pt-3 md:pt-0">
            <div
              className="project-outcome-grid"
              aria-label={`${project.title} outcomes`}
            >
              {project.outcomes.map((outcome) => (
                <div key={outcome.label}>
                  <span>{outcome.label}</span>
                  <strong>{outcome.value}</strong>
                </div>
              ))}
            </div>
            <p className="max-w-[68ch] text-[clamp(0.92rem,1.25vw,1.15rem)] font-normal leading-relaxed">
              {project.summary}
            </p>
            {project.note && (
              <p className="project-evidence-note">{project.note}</p>
            )}
          </div>
        </FlowSection>
      );
    } else {
      return (
        <FlowSection
          key={project.id}
          id={project.id}
          aria-label={project.title}
          style={{ background: color.bg, color: color.fg }}
        >
          <div className="flex justify-between items-start gap-4">
            <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mt-1">
              {indexStr} — {project.category}
            </p>
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 uppercase tracking-wider text-[9px] md:text-[11px] font-bold hover:opacity-75 transition-opacity px-3 py-1.5 border border-current rounded-full whitespace-nowrap"
            >
              Live site <ArrowUpRight size={14} />
            </a>
          </div>
          <hr className="my-2 md:my-3.5 border-none border-t border-current opacity-30" />

          <div className="flex flex-col lg:flex-row lg:items-center gap-5 lg:gap-8 flex-1 min-h-0">
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <h2 className="text-[clamp(1.85rem,3.6vw,3.5rem)] font-bold leading-[0.95] uppercase tracking-tight">
                  {project.title}
                </h2>
              </div>
              <hr className="my-2 md:my-3.5 border-none border-t border-current opacity-30" />
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <p className="mb-1 text-[10px] md:text-xs font-bold uppercase tracking-wider">
                    Design focus
                  </p>
                  <p className="text-[clamp(0.82rem,0.98vw,0.96rem)] leading-relaxed opacity-75">
                    {project.focus}
                  </p>
                </div>
                <div className="flex-1">
                  <p className="mb-1 text-[10px] md:text-xs font-bold uppercase tracking-wider">
                    Role
                  </p>
                  <p className="text-[clamp(0.82rem,0.98vw,0.96rem)] leading-relaxed opacity-75">
                    {project.role}
                  </p>
                </div>
              </div>

              <hr className="my-2 md:my-3 border-none border-t border-current opacity-30 hidden lg:block" />

              <div className="mt-auto pt-4 lg:pt-0">
                <div
                  className="project-outcome-grid"
                  aria-label={`${project.title} outcome`}
                >
                  <div>
                    <span>Delivered outcome</span>
                    <strong>{project.outcome}</strong>
                  </div>
                </div>
                <p className="max-w-[60ch] text-[clamp(0.92rem,1.25vw,1.15rem)] font-normal leading-relaxed">
                  {project.summary}
                </p>
                <p className="mt-2.5 text-[10px] md:text-xs font-mono opacity-60 uppercase tracking-wider">
                  {project.tech.join(", ")}
                </p>
              </div>
            </div>

            <div className="flex-1 relative rounded-xl overflow-hidden aspect-[16/9] max-h-[220px] md:max-h-none md:aspect-video border border-current/10 bg-black/10">
              <Image
                src={project.image}
                alt={project.title}
                fill
                sizes="(max-width: 1023px) 100vw, 46vw"
                className="object-cover object-top"
                quality={85}
              />
            </div>
          </div>
        </FlowSection>
      );
    }
  });

  return <FlowArt aria-label={title}>{content}</FlowArt>;
}
