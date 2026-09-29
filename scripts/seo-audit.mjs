import { readFileSync } from "node:fs";

const seoSource = readFileSync(new URL("../src/data/seo-keywords.ts", import.meta.url), "utf8");
const schemaSource = readFileSync(new URL("../src/components/seo-schema.tsx", import.meta.url), "utf8");
const siteConfig = readFileSync(new URL("../src/config/site.ts", import.meta.url), "utf8");
const sitemapSource = readFileSync(new URL("../src/app/sitemap.ts", import.meta.url), "utf8");
const contentSource = readFileSync(new URL("../src/app/[...slug]/page.tsx", import.meta.url), "utf8");
const homeSource = readFileSync(new URL("../src/app/page.tsx", import.meta.url), "utf8");

const failures = [];

const blockMatches = [...seoSource.matchAll(/\b(core|roadmap|roadmapCandidate|adjacent)\(\{ path: "([^"]+)"([\s\S]*?)\}\),/g)];
const pages = blockMatches.map((match) => {
  const wrapper = match[1];
  const path = match[2];
  const block = match[0];
  const get = (re) => block.match(re)?.[1] ?? null;
  return {
    wrapper,
    path,
    block,
    title: get(/title: "([^"]+)"/),
    h1: get(/h1: "([^"]+)"/),
    description: get(/description: "([^"]+)"/),
    primaryKeyword: get(/primaryKeyword: "([^"]+)"/),
    cluster: get(/cluster: "([^"]+)"/),
    indexable: wrapper === "core",
    needsUSVerification: wrapper !== "core",
    outsideMaster: block.includes("outsideMaster: true"),
  };
});

const pageByPath = new Map(pages.map((page) => [page.path, page]));
const paths = pages.map((page) => page.path);

function duplicates(values) {
  return [...new Set(values.filter((value, index) => values.indexOf(value) !== index))];
}

const duplicatePaths = duplicates(paths);
if (duplicatePaths.length) failures.push(`Duplicate canonical path(s): ${duplicatePaths.join(", ")}`);

const duplicatePrimary = duplicates(pages.map((page) => page.primaryKeyword).filter(Boolean));
if (duplicatePrimary.length) failures.push(`Duplicate primary keyword(s): ${duplicatePrimary.join(", ")}`);

const duplicateIndexableClusters = duplicates(pages.filter((page) => page.indexable).map((page) => page.cluster).filter(Boolean));
if (duplicateIndexableClusters.length) failures.push(`Duplicate indexable cluster(s): ${duplicateIndexableClusters.join(", ")}`);

for (const page of pages) {
  if (!page.title) failures.push(`Missing title: ${page.path}`);
  if (!page.h1) failures.push(`Missing H1: ${page.path}`);
  if (!page.description) failures.push(`Missing meta description: ${page.path}`);
  if (!page.primaryKeyword) failures.push(`Missing primary keyword: ${page.path}`);
  if (!page.cluster) failures.push(`Missing cluster: ${page.path}`);
  if (page.outsideMaster && page.indexable) failures.push(`Outside-master route must remain noindex: ${page.path}`);
}

const requiredRoutes = [
  "/",
  "/construction-equipment-management-software",
  "/construction-equipment-tracking-software",
  "/tool-management-software",
  "/tool-inventory-software",
  "/construction-asset-tracking-software",
  "/asset-tagging-system",
  "/equipment-checkout",
  "/construction-equipment-maintenance-software",
  "/blog/how-to-manage-construction-site-inventory",
  "/industries/plumbing-contractors",
  "/industries/electrical-contractors",
  "/industries/general-contractors",
  "/best/tool-tracking-software",
  "/guides/how-to-keep-track-of-tools-and-equipment",
  "/guides/how-to-store-power-tools",
  "/guides/asset-tracking-cost",
  "/guides/asset-tracking-technologies",
  "/guides/tool-calibration-tracking",
  "/guides/qr-code-vs-barcode-tool-tracking",
  "/guides/cmms-vs-tool-tracking-software",
  "/guides/construction-management-software-vs-tool-tracking-software",
  "/guides/warehouse-management-software-vs-tool-tracking-software",
  "/guides/field-service-management-vs-tool-tracking-software",
];
for (const path of requiredRoutes) if (!pageByPath.has(path)) failures.push(`Missing Master route: ${path}`);

const registryMatch = seoSource.match(/export const keywordRegistry: KeywordRegistryEntry\[\] = (\[[\s\S]*?\]);/);
if (!registryMatch) {
  failures.push("Keyword registry export is missing.");
} else {
  try {
    const registry = JSON.parse(registryMatch[1]);
    if (registry.length !== 135) failures.push(`Expected 135 Master keyword registry entries, found ${registry.length}.`);
    for (const entry of registry) {
      if (entry.decision === "active" && entry.targetUrl && !pageByPath.has(entry.targetUrl)) {
        failures.push(`Active keyword points to missing route: ${entry.keyword} -> ${entry.targetUrl}`);
      }
      if ((entry.decision === "hold" || entry.decision === "excluded") && entry.targetUrl !== null) {
        failures.push(`Hold/excluded keyword unexpectedly has target URL: ${entry.keyword}`);
      }
    }
  } catch (error) {
    failures.push(`Keyword registry is not valid JSON data: ${error.message}`);
  }
}

if (!siteConfig.includes('const rawSiteUrl = "https://takemovereturn.com";')) {
  failures.push("Canonical site URL must be https://takemovereturn.com.");
}

if (!sitemapSource.includes('page.status === "indexable" && !page.needsUSVerification')) {
  failures.push("Sitemap must gate SEO pages on indexable status and completed US verification.");
}

if (!contentSource.includes('seoPage.status !== "indexable" || seoPage.needsUSVerification')) {
  failures.push("SEO page metadata must noindex pages that are pending verification.");
}

for (const schemaType of ["Brand", "WebSite", "SoftwareApplication", "BreadcrumbList", "FAQPage"]) {
  if (!schemaSource.includes(`"@type": "${schemaType}"`)) failures.push(`Missing schema type: ${schemaType}`);
}

const visibleChecks = [
  ["/", "construction tool tracking software"],
  ["/", "tool tracking software"],
  ["/", "tools and equipment tracking"],
  ["/", "small tool tracking software"],
  ["/", "tool tracking app"],
  ["/construction-equipment-management-software", "equipment management software"],
  ["/construction-equipment-management-software", "equipment management system"],
  ["/construction-equipment-management-software", "heavy equipment management software"],
  ["/construction-equipment-tracking-software", "equipment tracker"],
  ["/construction-equipment-tracking-software", "equipment tracking system"],
  ["/tool-management-software", "tool management systems"],
  ["/tool-management-software", "tool management solution"],
  ["/tool-management-software", "tool management tool"],
  ["/tool-inventory-software", "equipment inventory software"],
  ["/tool-inventory-software", "tool inventory management"],
  ["/tool-inventory-software", "tool inventory tracking system"],
  ["/tool-inventory-software", "tool inventory app"],
  ["/asset-tagging-system", "asset tag system"],
  ["/asset-tagging-system", "barcode asset tracking"],
  ["/asset-tagging-system", "qr code tracking system"],
  ["/equipment-checkout", "tool checkout system"],
  ["/equipment-checkout", "equipment checkout"],
  ["/equipment-checkout", "tool checkout tracking"],
  ["/equipment-checkout", "tool return tracking"],
  ["/construction-equipment-maintenance-software", "maintenance management software"],
  ["/construction-equipment-maintenance-software", "equipment maintenance tracking software"],
  ["/construction-equipment-maintenance-software", "asset maintenance software"],
  ["/construction-equipment-maintenance-software", "work order tracking software"],
  ["/industries/plumbing-contractors", "tool tracking solution for plumbers"],
  ["/industries/plumbing-contractors", "tool tracking tool for plumbers"],
  ["/industries/plumbing-contractors", "tool management tool for plumbers"],
  ["/industries/plumbing-contractors", "asset tracking tool for plumbers"],
  ["/industries/electrical-contractors", "tool tracking solution for electricians"],
  ["/industries/electrical-contractors", "tool tracking tool for electricians"],
  ["/industries/general-contractors", "tool tracking solution for general contractors"],
  ["/best/tool-tracking-software", "best tool tracking system"],
  ["/best/tool-tracking-software", "best tool tracking platform for field crews"],
  ["/guides/how-to-store-power-tools", "storing power tools"],
  ["/guides/asset-tracking-technologies", "technology asset tracking"],
  ["/guides/tool-calibration-tracking", "calibrate a tool"],
  ["/guides/qr-code-vs-barcode-tool-tracking", "barcode tool tracking system"],
  ["/guides/cmms-vs-tool-tracking-software", "cmms software"],
  ["/guides/construction-management-software-vs-tool-tracking-software", "project management software for construction"],
  ["/guides/warehouse-management-software-vs-tool-tracking-software", "warehouse management system software"],
  ["/guides/field-service-management-vs-tool-tracking-software", "field service management software"],
];

for (const [path, keyword] of visibleChecks) {
  const page = pageByPath.get(path);
  if (!page) continue;
  let visible = page.block
    .replace(/secondaryKeywords: \[[^\]]*\]/g, "")
    .replace(/primaryKeyword: "[^"]+"/g, "")
    .replace(/keyword: "[^"]+"/g, "")
    .toLowerCase();
  if (path === "/") visible += "\n" + homeSource.toLowerCase();
  if (!visible.includes(keyword.toLowerCase())) failures.push(`Keyword not visible in intended page copy: "${keyword}" -> ${path}`);
}

const root = pageByPath.get("/");
const requiredHomeLinks = [
  "/construction-equipment-management-software",
  "/construction-equipment-tracking-software",
  "/tool-management-software",
  "/tool-inventory-software",
  "/construction-asset-tracking-software",
  "/asset-tagging-system",
  "/equipment-checkout",
  "/construction-equipment-maintenance-software",
];
for (const path of requiredHomeLinks) {
  if (!root?.block.includes(path)) failures.push(`Homepage relatedPaths missing core link: ${path}`);
}
if (!homeSource.includes("page?.relatedPaths?.map")) failures.push("Homepage does not render configured related SEO links.");

const unsupportedPositiveClaims = [
  "supports live gps",
  "real-time gps tracking",
  "built-in geofencing",
  "rfid tracking is included",
  "bluetooth beacon tracking is included",
];
const lowerSeo = seoSource.toLowerCase();
for (const claim of unsupportedPositiveClaims) if (lowerSeo.includes(claim)) failures.push(`Unsupported product claim detected: ${claim}`);

const indexableCount = pages.filter((page) => page.indexable).length;
const pendingCount = pages.filter((page) => !page.indexable).length;

console.log("TAKEMOVERETURN SEO DEPLOYMENT AUDIT");
console.log(`Routes: ${pages.length}`);
console.log(`Indexable: ${indexableCount}`);
console.log(`Noindex pending: ${pendingCount}`);
console.log(`Keyword registry: ${registryMatch ? "present" : "missing"}`);
console.log(`Canonical/route uniqueness: ${duplicatePaths.length ? "FAIL" : "PASS"}`);
console.log(`Primary keyword uniqueness: ${duplicatePrimary.length ? "FAIL" : "PASS"}`);
console.log(`Indexable cluster uniqueness: ${duplicateIndexableClusters.length ? "FAIL" : "PASS"}`);
console.log(`Index gate: ${sitemapSource.includes('page.status === "indexable" && !page.needsUSVerification') ? "PASS" : "FAIL"}`);
console.log(`Visible keyword checks: ${visibleChecks.length}`);

if (failures.length) {
  console.error("\nSEO audit failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("\nSEO deployment audit passed.");
