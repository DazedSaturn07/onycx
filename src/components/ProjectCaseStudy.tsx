import { ArrowUpRight } from "lucide-react";
import type { CSSProperties } from "react";
import type { RepositoryProject } from "@/data/project-catalog";
import ProjectArtwork from "@/components/ProjectArtwork";

export default function ProjectCaseStudy({ project, index, stacked = false }: { project: RepositoryProject; index: number; stacked?: boolean }) {
  return (
    <article
      className={"project-case-card" + (stacked ? " is-stacked" : "")}
      style={stacked ? ({ "--stack-top": 6.5 + index * 0.65 + "rem", zIndex: index + 10 } as CSSProperties) : undefined}
      aria-labelledby={"project-title-" + project.id}
    >
      <div className="project-case-art" data-reveal data-reveal-side="left">
        <ProjectArtwork visual={project.visual} title={project.title} />
      </div>
      <div className="project-case-copy" data-reveal data-reveal-side="right">
        <div className="project-case-meta"><span>{String(index + 1).padStart(2, "0")} / {project.category}</span><span>Repository study</span></div>
        <h3 id={"project-title-" + project.id}>{project.title}</h3>
        <p className="project-case-summary">{project.summary}</p>
        <dl className="project-case-context">
          <div><dt>Business question</dt><dd>{project.question}</dd></div>
          <div><dt>Method</dt><dd>{project.approach}</dd></div>
        </dl>
        <ul className="project-case-tech" aria-label={project.title + " technologies"}>
          {project.technologies.map((technology) => <li key={technology}>{technology}</li>)}
        </ul>
        {project.note && <p className="project-case-note">{project.note}</p>}
        <a className="project-case-link" href={project.repoUrl} target="_blank" rel="noopener noreferrer">
          Read the repository <ArrowUpRight size={16} aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}
