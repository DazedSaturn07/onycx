import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-config";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, changeFrequency: "monthly", priority: 1 },
    { url: new URL("/projects", siteUrl).toString(), changeFrequency: "monthly", priority: 0.8 },
  ];
}
