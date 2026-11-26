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
          <div className="flex justify-between items-center gap-2.5">
            <p className="text-[10px] lg:text-xs font-bold uppercase tracking-[0.16em] lg:tracking-[0.2em] leading-tight">
              {indexStr} — {project.category}
            </p>
            <div className="flex flex-row gap-2 sm:gap-3 items-center shrink-0">
              {dashboardProjects.some((item) => item.id === project.id) && (
                <Link
                  href={`/projects/${project.id}/dashboard`}
                  className="flex items-center gap-1.5 uppercase tracking-wider text-[9px] lg:text-[11px] font-bold hover:opacity-75 transition-opacity px-2.5 py-1.5 lg:px-3 border border-current rounded-full whitespace-nowrap"
                >
                  Dashboard <ArrowUpRight size={13} />
                </Link>
              )}
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 uppercase tracking-wider text-[9px] lg:text-[11px] font-bold hover:opacity-75 transition-opacity px-2 py-1.5 lg:px-3 border border-transparent whitespace-nowrap"
              >
                Repo<span className="hidden sm:inline">sitory</span> <ArrowUpRight size={13} />
              </a>
            </div>
          </div>
          <hr className="my-1.5 lg:my-3.5 border-none border-t border-current opacity-30" />
          <div>
            <h2 className="text-[clamp(1.48rem,5.2vw,3.4rem)] font-bold leading-[0.98] uppercase tracking-tight">
              {project.title}
            </h2>
          </div>
          <hr className="my-1.5 lg:my-3.5 border-none border-t border-current opacity-30" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3.5 lg:gap-7">
            <div className="min-w-0">
              <p className="mb-1 text-[10px] lg:text-xs font-bold uppercase tracking-wider">
                Business question
              </p>
              <p className="text-[12.5px] leading-[1.45] sm:text-[13px] lg:text-[clamp(0.82rem,0.98vw,0.96rem)] lg:leading-relaxed opacity-75">
                {project.question}
              </p>
            </div>
            <div className="min-w-0">
              <p className="mb-1 text-[10px] lg:text-xs font-bold uppercase tracking-wider">
                Approach
              </p>
              <p className="text-[12.5px] leading-[1.45] sm:text-[13px] lg:text-[clamp(0.82rem,0.98vw,0.96rem)] lg:leading-relaxed opacity-75">
                {project.approach}
              </p>
            </div>
            <div className="sm:col-span-2 lg:col-span-1 min-w-0">
              <p className="mb-1 text-[10px] lg:text-xs font-bold uppercase tracking-wider">
                Technologies
              </p>
              <p className="text-[11.5px] leading-[1.45] sm:text-[12.5px] lg:text-[clamp(0.82rem,0.98vw,0.96rem)] lg:leading-relaxed opacity-75">
                {project.technologies.join(", ")}
              </p>
            </div>
          </div>

          <hr className="my-2 lg:my-3 border-none border-t border-current opacity-30 hidden lg:block" />

          <div className="mt-1.5 lg:mt-auto pt-1.5 lg:pt-0">
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
            <p className="max-w-[68ch] text-[13px] leading-[1.48] sm:text-[14px] lg:text-[clamp(0.92rem,1.25vw,1.15rem)] font-normal lg:leading-relaxed">
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
          <div className="flex justify-between items-center gap-2.5">
            <p className="text-[10px] lg:text-xs font-bold uppercase tracking-[0.16em] lg:tracking-[0.2em] leading-tight">
              {indexStr} — {project.category}
            </p>
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 uppercase tracking-wider text-[9px] lg:text-[11px] font-bold hover:opacity-75 transition-opacity px-2.5 py-1.5 lg:px-3 border border-current rounded-full whitespace-nowrap shrink-0"
            >
              Live site <ArrowUpRight size={13} />
            </a>
          </div>
          <hr className="my-1.5 lg:my-3.5 border-none border-t border-current opacity-30" />

          <div className="flex flex-col md:flex-row md:items-center gap-3.5 md:gap-6 lg:gap-8 flex-1 min-h-0">
            <div className="flex-1 flex flex-col justify-between min-w-0">
              <div>
                <h2 className="text-[clamp(1.48rem,5.2vw,3.4rem)] font-bold leading-[0.98] uppercase tracking-tight">
                  {project.title}
                </h2>
              </div>
              <hr className="my-1.5 lg:my-3.5 border-none border-t border-current opacity-30" />
              <div className="grid grid-cols-[1.5fr_0.9fr] sm:grid-cols-2 gap-3 md:gap-4">
                <div className="min-w-0">
                  <p className="mb-1 text-[10px] lg:text-xs font-bold uppercase tracking-wider">
                    Design focus
                  </p>
                  <p className="text-[12.5px] leading-[1.45] sm:text-[13px] lg:text-[clamp(0.82rem,0.98vw,0.96rem)] lg:leading-relaxed opacity-75">
                    {project.focus}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="mb-1 text-[10px] lg:text-xs font-bold uppercase tracking-wider">
                    Role
                  </p>
                  <p className="text-[12.5px] leading-[1.45] sm:text-[13px] lg:text-[clamp(0.82rem,0.98vw,0.96rem)] lg:leading-relaxed opacity-75">
                    {project.role}
                  </p>
                </div>
              </div>

              <hr className="my-2 lg:my-3 border-none border-t border-current opacity-30 hidden lg:block" />

              <div className="mt-2 lg:mt-auto pt-1.5 lg:pt-0">
                <div
                  className="project-outcome-grid"
                  aria-label={`${project.title} outcome`}
                >
                  <div>
                    <span>Delivered outcome</span>
                    <strong>{project.outcome}</strong>
                  </div>
                </div>
                <p className="max-w-[60ch] text-[12.5px] leading-[1.45] sm:text-[13.5px] lg:text-[clamp(0.92rem,1.25vw,1.15rem)] font-normal lg:leading-relaxed">
                  {project.summary}
                </p>
                <p className="mt-2 lg:mt-2.5 text-[10px] lg:text-xs font-mono opacity-60 uppercase tracking-wider">
                  {project.tech.join(", ")}
                </p>
              </div>
            </div>

            <div className="w-full md:flex-1 relative rounded-xl overflow-hidden h-[168px] sm:h-[200px] md:h-auto md:aspect-video border border-current/10 bg-black/10 shrink-0">
              <Image
                src={project.image}
                alt={project.title}
                fill
                sizes="(max-width: 767px) 92vw, 46vw"
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
