import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/data/seo-keywords.ts", import.meta.url), "utf8");
const schemaSource = readFileSync(new URL("../src/components/seo-schema.tsx", import.meta.url), "utf8");
const paths = [...source.matchAll(/path: "([^"]+)"/g)].map(([, path]) => path);
const pages = [...source.matchAll(/(?:title|h1|primaryKeyword): "([^"]+)"/g)].map(([, value]) => value);
const failures = [];
for (const field of ["metricSource", "metricScope", "metricCheckedAt", "pageType", "needsUSVerification", "status"]) if (!source.includes(field)) failures.push(`Missing SEO field: ${field}`);
const duplicatePaths = paths.filter((path, index) => paths.indexOf(path) !== index);
if (duplicatePaths.length) failures.push(`Duplicate path: ${duplicatePaths[0]}`);
if (paths.length < 20) failures.push(`Expected at least 20 SEO routes, found ${paths.length}.`);
if (pages.length < paths.length * 3) failures.push("SEO routes are missing title, h1, or primary keyword data.");
if (!paths.length) failures.push("No SEO pages found.");
for (const schemaType of ["Organization", "WebSite", "SoftwareApplication", "BreadcrumbList", "FAQPage"]) if (!schemaSource.includes(`\"@type\": \"${schemaType}\"`)) failures.push(`Missing schema type: ${schemaType}`);
if (failures.length) { console.error(failures.join("\n")); process.exit(1); }
console.log(`SEO audit passed for ${paths.length} canonical routes.`);
