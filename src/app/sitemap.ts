import type { MetadataRoute } from "next";
import { siteConfig } from "../config/site";
import { seoPages } from "../data/seo-keywords";
import { helpArticles, helpContentUpdatedAt } from "../data/help-articles";

const paths = ["/features", "/pricing", "/help", "/help/contact"];

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = paths.map((path) => ({ url: new URL(path, siteConfig.siteUrl).toString(), lastModified: new Date("2026-09-24") }));
  const helpEntries = helpArticles.map((article) => ({ url: new URL(`/help/${article.slug}`, siteConfig.siteUrl).toString(), lastModified: new Date(helpContentUpdatedAt) }));
  const seoEntries = seoPages.filter((page) => page.status === "indexable" && !page.needsUSVerification).map((page) => ({ url: new URL(page.path, siteConfig.siteUrl).toString(), lastModified: new Date(page.dateModified) }));
  return [...staticPages, ...helpEntries, ...seoEntries];
}
