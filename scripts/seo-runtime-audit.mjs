import assert from "node:assert/strict";
import { seoPages } from "../src/data/seo-keywords.ts";
import { softwareSchema } from "../src/lib/public-seo.ts";
import { siteConfig } from "../src/config/site.ts";

export async function auditPublicSeo(origin) {
  const base = new URL(origin);
  assert.ok(["http:", "https:"].includes(base.protocol), "Expected an HTTP(S) origin");
  const fetchPublic = (path) => fetch(new URL(path, base), { signal: AbortSignal.timeout(20_000), redirect: "manual" });
  const sitemapResponse = await fetchPublic("/sitemap.xml");
  assert.equal(sitemapResponse.status, 200);
  const sitemap = await sitemapResponse.text();
  const expectedOffers = softwareSchema().offers;
  const routes = [...seoPages, { path: "/pricing", canonical: "/pricing", status: "indexable", needsUSVerification: false }];
  for (const page of routes) {
    const response = await fetchPublic(page.path);
    assert.equal(response.status, 200, page.path);
    const html = await response.text();
    assert.equal((html.match(/<h1\b/g) ?? []).length, 1, `${page.path}: one H1 required`);
    const canonicalTag = html.match(/<link\b[^>]*rel="canonical"[^>]*>/)?.[0];
    const canonical = canonicalTag?.match(/href="([^"]+)"/)?.[1];
    assert.ok(canonical, `${page.path}: canonical missing`);
    assert.equal(new URL(canonical).href, new URL(page.canonical, siteConfig.siteUrl).href, `${page.path}: canonical mismatch`);
    assert.ok(/<meta name="description" content="[^"]+"/.test(html), `${page.path}: description missing`);
    assert.ok(html.includes('property="og:image"'), `${page.path}: share image missing`);
    const indexable = page.status === "indexable" && !page.needsUSVerification;
    assert.equal(/<meta name="robots" content="[^"]*noindex/.test(html), !indexable, `${page.path}: index gate mismatch`);
    assert.equal(sitemap.includes(`<loc>${new URL(page.path, siteConfig.siteUrl)}</loc>`), indexable, `${page.path}: sitemap gate mismatch`);
    const schemas = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((match) => JSON.parse(match[1]));
    assert.ok(schemas.length, `${page.path}: JSON-LD missing`);
    const software = schemas.find((schema) => schema["@type"] === "SoftwareApplication");
    if (page.path === "/pricing" || page.pageType === "money" || page.pageType === "industry") {
      assert.deepEqual(software?.offers, expectedOffers, `${page.path}: offers differ from plan config`);
    }
    const article = schemas.find((schema) => schema["@type"] === "Article");
    if (article) {
      assert.equal(article.dateModified, page.dateModified);
      assert.equal(article.publisher.name, siteConfig.legal.legalOperatorName);
      assert.ok(html.includes("AI-assisted content"), `${page.path}: editorial disclosure missing`);
    }
    const visibleHtml = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "");
    for (const schema of schemas.filter((item) => item["@type"] === "FAQPage")) {
      for (const question of schema.mainEntity) {
        const escape = (value) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
        assert.ok(visibleHtml.includes(escape(question.name)), `${page.path}: invisible FAQ question`);
        assert.ok(visibleHtml.includes(escape(question.acceptedAnswer.text)), `${page.path}: invisible FAQ answer`);
      }
    }
  }
  const robots = await (await fetchPublic("/robots.txt")).text();
  for (const path of ["/app/", "/api/", "/q/", "/auth/", "/field/"]) assert.ok(robots.includes(`Disallow: ${path}`), `robots: ${path}`);
  for (const path of ["/resources/tool-register-example.csv", "/help/import-export", "/opengraph-image"]) {
    const response = await fetchPublic(path);
    assert.equal(response.status, 200, `${path}: resource unavailable`);
    if (path === "/opengraph-image") assert.ok(response.headers.get("content-type")?.includes("image/png"));
  }
  console.log(`Public SEO runtime audit passed: ${routes.length} pages, plan offers, visible FAQs, editorial metadata, resources and index gates. This is not proof of search-engine indexing or verified bot access.`);
}

if (process.argv[1]?.endsWith("seo-runtime-audit.mjs")) {
  await auditPublicSeo(process.argv[2] ?? "https://takemovereturn.com");
}
