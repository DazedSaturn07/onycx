'use client';

import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import FlowArt, { FlowSection } from '@/components/ui/story-scroll';
import type { RepositoryProject } from '@/data/project-catalog';
import type { PortfolioProject } from '@/data/portfolio';

const PALETTE = [
  { bg: '#000000', fg: '#ffffff' },
  { bg: '#F5F0E8', fg: '#000000' },
  { bg: '#1A3DE8', fg: '#ffffff' },
  { bg: '#fd5200', fg: '#ffffff' },
  { bg: '#2C4C3B', fg: '#ffffff' },
];

function isRepoProject(p: RepositoryProject | PortfolioProject): p is RepositoryProject {
  return 'question' in p;
}

export function ProjectShowcase({
  projects,
  title
}: {
  projects: (RepositoryProject | PortfolioProject)[];
  title: string;
}) {
  const content = projects.map((project, i) => {
    const color = PALETTE[i % PALETTE.length];
    const indexStr = String(i + 1).padStart(2, '0');

    if (isRepoProject(project)) {
      return (
        <FlowSection key={project.id} aria-label={project.title} style={{ backgroundColor: color.bg, color: color.fg }}>
          <div className="flex justify-between items-start gap-4">
            <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mt-2">{indexStr} — {project.category}</p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-end sm:items-center">
               {["retail-iq", "shoplens", "customer-behaviour", "sales-analysis"].includes(project.id) && (
                 <Link href={`/projects/${project.id}/dashboard`} className="flex items-center gap-1.5 uppercase tracking-wider text-[9px] md:text-[11px] font-bold hover:opacity-75 transition-opacity px-3 py-1.5 border border-current rounded-full whitespace-nowrap">
                   Dashboard <ArrowUpRight size={14} />
                 </Link>
               )}
               <a href={project.repoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 uppercase tracking-wider text-[9px] md:text-[11px] font-bold hover:opacity-75 transition-opacity px-3 py-1.5 border border-transparent whitespace-nowrap">
                 Repository <ArrowUpRight size={14} />
               </a>
            </div>
          </div>
          <hr className="my-4 md:my-[2vw] border-none border-t border-current opacity-30" />
          <div>
            <h2 className="text-[clamp(2.5rem,6vw,6rem)] font-bold leading-[0.9] uppercase tracking-tight">
              {project.title}
            </h2>
          </div>
          <hr className="my-4 md:my-[2vw] border-none border-t border-current opacity-30" />

          <div className="flex flex-col md:flex-row gap-6 md:gap-[3vw]">
            <div className="flex-1">
              <p className="mb-1 md:mb-2 text-[10px] md:text-sm font-bold uppercase tracking-wider">Business question</p>
              <p className="text-[clamp(0.85rem,1.1vw,1.05rem)] leading-relaxed opacity-75">{project.question}</p>
            </div>
            <div className="flex-1">
              <p className="mb-1 md:mb-2 text-[10px] md:text-sm font-bold uppercase tracking-wider">Approach</p>
              <p className="text-[clamp(0.85rem,1.1vw,1.05rem)] leading-relaxed opacity-75">{project.approach}</p>
            </div>
            <div className="flex-1">
              <p className="mb-1 md:mb-2 text-[10px] md:text-sm font-bold uppercase tracking-wider">Technologies</p>
              <p className="text-[clamp(0.85rem,1.1vw,1.05rem)] leading-relaxed opacity-75">{project.technologies.join(', ')}</p>
            </div>
          </div>

          <hr className="my-4 md:my-[2vw] border-none border-t border-current opacity-30 hidden md:block" />

          <div className="mt-auto pt-4 md:pt-0">
             <p className="max-w-[60ch] text-[clamp(1rem,1.8vw,1.6rem)] font-normal leading-relaxed">
               {project.summary}
             </p>
          </div>
        </FlowSection>
      );
    } else {
      return (
        <FlowSection key={project.id} aria-label={project.title} style={{ backgroundColor: color.bg, color: color.fg }}>
          <div className="flex justify-between items-start gap-4">
            <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mt-2">{indexStr} — {project.category}</p>
            <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 uppercase tracking-wider text-[9px] md:text-[11px] font-bold hover:opacity-75 transition-opacity px-3 py-1.5 border border-current rounded-full whitespace-nowrap">
               Live site <ArrowUpRight size={14} />
            </a>
          </div>
          <hr className="my-4 md:my-[2vw] border-none border-t border-current opacity-30" />

          <div className="flex flex-col lg:flex-row gap-6 lg:gap-[4vw] flex-1 min-h-0">
             <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h2 className="text-[clamp(2.5rem,6vw,6rem)] font-bold leading-[0.9] uppercase tracking-tight">
                    {project.title}
                  </h2>
                </div>
                <hr className="my-4 md:my-[2vw] border-none border-t border-current opacity-30" />
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="flex-1">
                    <p className="mb-1 md:mb-2 text-[10px] md:text-sm font-bold uppercase tracking-wider">Design focus</p>
                    <p className="text-[clamp(0.85rem,1.1vw,1.05rem)] leading-relaxed opacity-75">{project.focus}</p>
                  </div>
                  <div className="flex-1">
                    <p className="mb-1 md:mb-2 text-[10px] md:text-sm font-bold uppercase tracking-wider">Role</p>
                    <p className="text-[clamp(0.85rem,1.1vw,1.05rem)] leading-relaxed opacity-75">{project.role}</p>
                  </div>
                </div>

                <hr className="my-4 md:my-[2vw] border-none border-t border-current opacity-30 hidden lg:block" />

                <div className="mt-auto pt-6 lg:pt-0">
                   <p className="max-w-[60ch] text-[clamp(1rem,1.8vw,1.6rem)] font-normal leading-relaxed">
                     {project.summary}
                   </p>
                   <p className="mt-3 text-[10px] md:text-xs font-mono opacity-60 uppercase tracking-wider">{project.tech.join(', ')}</p>
                </div>
             </div>

             <div className="flex-1 relative rounded-2xl overflow-hidden aspect-video border border-current/10 bg-black/10">
               {/* eslint-disable-next-line @next/next/no-img-element */}
               <img src={project.image} alt={project.title} className="w-full h-full object-contain absolute inset-0" />
             </div>
          </div>
        </FlowSection>
      );
    }
  });

  if (projects.length === 0) return null;

  if (projects.length === 1) {
    return (
      <div className="w-full">
        {content}
      </div>
    );
  }

  return (
    <FlowArt aria-label={title}>
      {content}
    </FlowArt>
  );
}
