import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-config";
import { analyticsDashboards } from "@/lib/analytics-dashboards";
import { studyDashboards } from "@/lib/study-dashboards";
import { operationDashboards } from "@/lib/operations-data";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, changeFrequency: "monthly", priority: 1 },
    { url: new URL("/projects", siteUrl).toString(), changeFrequency: "monthly", priority: 0.8 },
    ...Object.keys({ ...analyticsDashboards, ...studyDashboards, ...operationDashboards, novamart: true }).map((project) => ({
      url: new URL(`/projects/${project}/dashboard`, siteUrl).toString(),
      changeFrequency: "monthly" as const,
      priority: 0.65,
    })),
  ];
}
