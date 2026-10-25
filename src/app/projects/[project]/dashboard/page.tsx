import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";
import { studyDashboards } from "@/lib/study-dashboards";
import type { StudySlug } from "@/lib/study-dashboards";
import { DashboardThemeShell } from "@/components/dashboard/DashboardThemeShell";
import { CinematicFooter } from "@/components/ui/motion-footer";
import Navigation from "@/components/Navigation";
import { analyticsDashboards } from "@/lib/analytics-dashboards";
import type { AnalyticsDashboardSlug } from "@/lib/analytics-dashboards";
import { siteUrl } from "@/lib/site-config";
import { novaMart } from "@/lib/novamart";
import { operationDashboards } from "@/lib/operations-data";
import type { OperationsSlug } from "@/lib/operations-data";
import { dashboardProjects } from "@/data/project-catalog";
import "@/app/dashboard-4.css";
import "@/app/finance-bento.css";

const dashboards = {
  ...analyticsDashboards,
  ...studyDashboards,
  novamart: novaMart,
  ...operationDashboards,
};
const OperationsDashboard = dynamic(
  () => import("@/components/dashboard/OperationsDashboard"),
);
const NovaMartDashboard = dynamic(
  () => import("@/components/dashboard/NovaMartDashboard"),
);
const AnalyticsDashboard = dynamic(
  () => import("@/components/dashboard/AnalyticsDashboard"),
);
const StudyDashboard = dynamic(
  () => import("@/components/dashboard/StudyDashboard"),
);

interface DashboardPageProps {
  params: Promise<{ project: string }>;
}

export function generateStaticParams() {
  return Object.keys(dashboards).map((project) => ({ project }));
}

export async function generateMetadata({
  params,
}: DashboardPageProps): Promise<Metadata> {
  const { project } = await params;
  if (!Object.hasOwn(dashboards, project)) notFound();
  const dashboard = dashboards[project as keyof typeof dashboards];
  const title = `${dashboard.title} Dashboard — Prashant Yadav`;
  const canonical = `/projects/${project}/dashboard`;
  return {
    title,
    description: dashboard.summary,
    alternates: { canonical },
    openGraph: {
      type: "website",
      url: new URL(canonical, siteUrl),
      title,
      description: dashboard.summary,
      siteName: "Prashant Yadav",
      locale: "en_IN",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: dashboard.summary,
    },
  };
}

export default async function AnalyticsProjectDashboardPage({
  params,
}: DashboardPageProps) {
  const { project } = await params;
  if (!Object.hasOwn(dashboards, project)) notFound();
  const slug = project as keyof typeof dashboards;
  const dashboard = dashboards[slug];

  return (
    <>
      <Navigation />
      <DashboardThemeShell project={slug}>
        <header className="analytics-page-intro">
          <div className="analytics-page-intro-inner">
            <Link
              href={
                slug === "freightflow" || slug === "airops"
                  ? "/projects#supply-chain"
                  : "/projects#analytics"
              }
              className="analytics-project-return"
            >
              ← All analytics & operations projects
            </Link>
            <p className="analytics-page-eyebrow">
              <span />
              {dashboard.eyebrow}
            </p>
            <h1>
              {dashboard.title} <em>Interactive dashboard</em>
            </h1>
            <p className="analytics-page-summary">{dashboard.summary}</p>
            <div className="analytics-page-context">
              <span>
                <small>Source</small>
                {dashboard.source}
              </span>
              <span>
                <small>Data view</small>Aggregated and filterable in your
                browser
              </span>
            </div>
          </div>
        </header>

        <div className="analytics-project-dashboard-wrap">
          <nav className="study-project-nav" aria-label="Project dashboards">
            {dashboardProjects
              .map(
                ({ id }) =>
                  [id, dashboards[id as keyof typeof dashboards]] as const,
              )
              .map(([id, item]) => (
                <Link
                  key={id}
                  href={`/projects/${id}/dashboard`}
                  aria-current={id === slug ? "page" : undefined}
                >
                  {item.title}
                </Link>
              ))}
          </nav>
          {Object.hasOwn(operationDashboards, slug) ? (
            <OperationsDashboard project={slug as OperationsSlug} />
          ) : slug === "novamart" ? (
            <NovaMartDashboard />
          ) : Object.hasOwn(studyDashboards, slug) ? (
            <StudyDashboard key={slug} project={slug as StudySlug} />
          ) : (
            <AnalyticsDashboard
              key={slug}
              project={slug as AnalyticsDashboardSlug}
            />
          )}
          <details className="analytics-methodology">
            <summary>Methodology and source limits</summary>
            <p>
              Dashboard calculations use the project’s documented cleaning rules
              where they are reproducible. The accompanying quality panel and
              reporting files list exclusions, saved-output differences, missing
              values, and scope limits. Browser datasets contain aggregates or
              minimized analytical records. Source identifiers, customer and
              application IDs, descriptions and staff resources are omitted.
            </p>
          </details>
        </div>
        <CinematicFooter />
      </DashboardThemeShell>
    </>
  );
}
