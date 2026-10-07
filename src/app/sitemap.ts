import type { MetadataRoute } from "next";
import { siteConfig } from "../config/site";
import { seoPages } from "../data/seo-keywords";
import { helpArticles, helpContentUpdatedAt } from "../data/help-articles";

const staticPages = [
  { path: "/features", lastModified: "2026-09-24" },
  { path: "/pricing", lastModified: "2026-10-03" },
  { path: "/help", lastModified: helpContentUpdatedAt },
  { path: "/help/contact", lastModified: helpContentUpdatedAt },
  { path: "/about", lastModified: "2026-10-07" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries = staticPages.map(({ path, lastModified }) => ({
    url: new URL(path, siteConfig.siteUrl).toString(),
    lastModified: new Date(lastModified),
  }));
  const helpEntries = helpArticles.map((article) => ({
    url: new URL(`/help/${article.slug}`, siteConfig.siteUrl).toString(),
    lastModified: new Date(article.updatedAt ?? helpContentUpdatedAt),
  }));
  const seoEntries = seoPages
    .filter((page) => page.status === "indexable" && !page.needsUSVerification)
    .map((page) => ({
      url: new URL(page.path, siteConfig.siteUrl).toString(),
      lastModified: new Date(page.dateModified),
    }));
  return [...staticEntries, ...helpEntries, ...seoEntries];
}
