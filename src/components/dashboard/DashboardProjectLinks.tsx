import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import GithubIcon from "@/components/ui/github-icon";
import { dashboardProjects } from "@/data/project-catalog";

export function DashboardProjectLinks({ project }: { project: string }) {
  const entry = dashboardProjects.find((item) => item.id === project);
  if (!entry) return null;
  return (
    <div className="dashboard-project-links">
      <Link href={`/projects#${entry.id}`}>
        View project <ArrowUpRight size={14} aria-hidden="true" />
      </Link>
      <a
        href={entry.repoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="dashboard-repository-link"
        aria-label={`Open ${entry.title} GitHub repository`}
        title={`${entry.title} on GitHub`}
      >
        <GithubIcon size={18} />
      </a>
    </div>
  );
}
