import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AnalyticsDashboard from "@/components/dashboard/AnalyticsDashboard";
import { DashboardThemeShell } from "@/components/dashboard/DashboardThemeShell";
import { CinematicFooter } from "@/components/ui/motion-footer";
import Navigation from "@/components/Navigation";
import { analyticsDashboards } from "@/lib/analytics-dashboards";
import type { AnalyticsDashboardSlug } from "@/lib/analytics-dashboards";
import { siteUrl } from "@/lib/site-config";
import "@/app/dashboard-4.css";

interface DashboardPageProps {
  params: Promise<{ project: string }>;
}

export function generateStaticParams() {
  return Object.keys(analyticsDashboards).map((project) => ({ project }));
}

export async function generateMetadata({ params }: DashboardPageProps): Promise<Metadata> {
  const { project } = await params;
  if (!(project in analyticsDashboards)) notFound();
  const dashboard = analyticsDashboards[project as AnalyticsDashboardSlug];
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
    twitter: { card: "summary_large_image", title, description: dashboard.summary },
  };
}

export default async function AnalyticsProjectDashboardPage({ params }: DashboardPageProps) {
  const { project } = await params;
  if (!(project in analyticsDashboards)) notFound();
  const slug = project as AnalyticsDashboardSlug;
  const dashboard = analyticsDashboards[slug];

  return (
    <>
      <Navigation />
      <DashboardThemeShell project={slug}>
        <header className="analytics-page-intro">
          <div className="analytics-page-intro-inner">
            <Link href="/projects#analytics" className="analytics-project-return">← All retail & customer studies</Link>
            <p className="analytics-page-eyebrow"><span />{dashboard.eyebrow}</p>
            <h1>{dashboard.title} <em>Interactive dashboard</em></h1>
            <p className="analytics-page-summary">{dashboard.summary}</p>
            <div className="analytics-page-context">
              <span><small>Source</small>{dashboard.source}</span>
              <span><small>Data view</small>Aggregated and filterable in your browser</span>
            </div>
          </div>
        </header>

        <div className="analytics-project-dashboard-wrap">
          <AnalyticsDashboard key={slug} project={slug} />
          <details className="analytics-methodology">
            <summary>Methodology and source limits</summary>
            <p>
              Dashboard calculations use the project’s documented cleaning rules where they are reproducible. The accompanying quality panel and reporting files list exclusions, saved-output differences, missing values, and scope limits. Records are pre-aggregated; customer IDs and transaction-level rows are not shipped to the browser.
            </p>
          </details>
        </div>
        <CinematicFooter />
      </DashboardThemeShell>
    </>
  );
}
