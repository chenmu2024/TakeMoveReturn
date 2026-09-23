import type { MetadataRoute } from "next";
import { siteConfig } from "../config/site";

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: ["/app/", "/api/", "/login", "/signup", "/forgot-password"] }, sitemap: new URL("/sitemap.xml", siteConfig.siteUrl).toString() };
}
