import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { seoPages } from "../src/data/seo-keywords.ts";
import { helpArticles } from "../src/data/help-articles.ts";
import { softwareSchema } from "../src/lib/public-seo.ts";
import { siteConfig } from "../src/config/site.ts";

export async function auditPublicSeo(origin, baselinePath) {
  const base = new URL(origin);
  assert.ok(["http:", "https:"].includes(base.protocol), "Expected an HTTP(S) origin");
  const fetchPublic = (path) => fetch(new URL(path, base), { signal: AbortSignal.timeout(20_000), redirect: "manual" });
  const sitemapResponse = await fetchPublic("/sitemap.xml");
  assert.equal(sitemapResponse.status, 200);
  const sitemap = await sitemapResponse.text();
  const expectedOffers = softwareSchema().offers;
  const supplemental = ["/pricing", "/features", "/about", "/help", "/help/contact", ...helpArticles.map((article) => `/help/${article.slug}`)];
  const routes = [...seoPages, ...supplemental.map((path) => ({ path, canonical: path, status: "indexable", needsUSVerification: false }))];
  const titles = new Set();
  const descriptions = new Set();
  const snapshots = [];
  const links = new Set();
  const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  assert.equal(new Set(sitemapUrls).size, sitemapUrls.length, "Duplicate sitemap URL");
  assert.deepEqual(sitemapUrls.sort(), routes.filter((page) => page.status === "indexable" && !page.needsUSVerification).map((page) => new URL(page.path, siteConfig.siteUrl).href).sort(), "Unexpected sitemap membership");
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
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
    const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1];
    assert.ok(title && !titles.has(title), `${page.path}: missing or duplicate title`);
    assert.ok(!descriptions.has(description), `${page.path}: duplicate description`);
    titles.add(title);
    descriptions.add(description);
    assert.ok(html.includes('property="og:image"'), `${page.path}: share image missing`);
    const indexable = page.status === "indexable" && !page.needsUSVerification;
    assert.equal(/<meta name="robots" content="[^"]*noindex/.test(html), !indexable, `${page.path}: index gate mismatch`);
    assert.equal(sitemap.includes(`<loc>${new URL(page.path, siteConfig.siteUrl)}</loc>`), indexable, `${page.path}: sitemap gate mismatch`);
    const schemas = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((match) => JSON.parse(match[1]));
    if (!supplemental.includes(page.path) || ["/pricing", "/about"].includes(page.path)) assert.ok(schemas.length, `${page.path}: JSON-LD missing`);
    if (page.path === "/about") {
      assert.ok(html.includes('id="operator"'), "About: operator anchor missing");
      assert.equal(schemas.find((schema) => schema["@type"] === "Person")?.name, siteConfig.legal.legalOperatorName);
    }
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
    const pageLinks = [...visibleHtml.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map((match) => new URL(match[1].replaceAll("&amp;", "&"), new URL(page.path, base))).filter((url) => url.origin === base.origin && !/^\/(app|api|auth|q|field)(\/|$)/.test(url.pathname));
    pageLinks.forEach((url) => links.add(url.pathname));
    const preview = visibleHtml.match(/<img\b[^>]*src="\/images\/product-workspace-1024.webp"[^>]*>/)?.[0];
    if (page.path === "/" || !supplemental.includes(page.path)) {
      assert.ok(preview, `${page.path}: responsive product preview missing`);
      assert.ok(preview.includes('width="1024"') && preview.includes('height="1536"'), `${page.path}: wrong image aspect ratio`);
      for (const width of [480, 768, 1024]) assert.ok(preview.includes(`product-workspace-${width}.webp ${width}w`), `${page.path}: missing responsive source`);
    }
    snapshots.push({ path: page.path, status: response.status, title, description, canonical, indexable, links: [...new Set(pageLinks.map((url) => url.pathname))].sort() });
    for (const schema of schemas.filter((item) => item["@type"] === "FAQPage")) {
      for (const question of schema.mainEntity) {
        const escape = (value) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
        assert.ok(visibleHtml.includes(escape(question.name)), `${page.path}: invisible FAQ question`);
        assert.ok(visibleHtml.includes(escape(question.acceptedAnswer.text)), `${page.path}: invisible FAQ answer`);
      }
    }
  }
  for (const path of links) {
    if (routes.some((page) => page.path === path)) continue;
    const response = await fetchPublic(path);
    assert.ok(response.status >= 200 && response.status < 400, `${path}: broken public link (${response.status})`);
    await response.body?.cancel();
  }
  for (const url of sitemapUrls) assert.ok(links.has(new URL(url).pathname), `${url}: no inbound public link`);
  const robots = await (await fetchPublic("/robots.txt")).text();
  for (const path of ["/app/", "/api/", "/q/", "/auth/", "/field/"]) assert.ok(robots.includes(`Disallow: ${path}`), `robots: ${path}`);
  for (const path of ["/resources/tool-register-example.csv", "/help/import-export", "/opengraph-image"]) {
    const response = await fetchPublic(path);
    assert.equal(response.status, 200, `${path}: resource unavailable`);
    if (path === "/opengraph-image") assert.ok(response.headers.get("content-type")?.includes("image/png"));
    await response.body?.cancel();
  }
  const images = [];
  for (const [width, budget] of [[480, 60_000], [768, 100_000], [1024, 150_000]]) {
    const path = `/images/product-workspace-${width}.webp`;
    const response = await fetchPublic(path);
    assert.equal(response.status, 200, path);
    assert.ok(response.headers.get("content-type")?.includes("image/webp"), `${path}: wrong content type`);
    const bytes = Buffer.from(await response.arrayBuffer());
    assert.equal(bytes.toString("ascii", 0, 4), "RIFF", `${path}: invalid image`);
    assert.equal(bytes.toString("ascii", 8, 12), "WEBP", `${path}: invalid image`);
    assert.ok(bytes.length <= budget, `${path}: image exceeds ${budget}-byte budget`);
    images.push({ path, bytes: bytes.length });
  }
  if (baselinePath) {
    const versionResponse = await fetchPublic("/api/version");
    assert.equal(versionResponse.status, 200, "Version endpoint unavailable");
    writeFileSync(baselinePath, JSON.stringify({ checkedAt: new Date().toISOString(), origin: base.origin, version: await versionResponse.json(), pages: snapshots, images }, null, 2) + "\n");
  }
  console.log(`Public SEO runtime audit passed: ${routes.length} pages, ${links.size} linked public paths, responsive images, plan offers, visible FAQs, editorial metadata and index gates. This is not proof of search-engine indexing or verified bot access.`);
}

if (process.argv[1]?.endsWith("seo-runtime-audit.mjs")) {
  const baselineIndex = process.argv.indexOf("--baseline");
  if (baselineIndex !== -1) assert.ok(process.argv[baselineIndex + 1], "--baseline requires an output path");
  await auditPublicSeo(process.argv[2] ?? "https://takemovereturn.com", baselineIndex === -1 ? undefined : process.argv[baselineIndex + 1]);
}
