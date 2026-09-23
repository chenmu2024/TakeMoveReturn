import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/data/seo-keywords.ts", import.meta.url), "utf8");
const pages = [...source.matchAll(/core\(\{ path: "([^"]+)", title: "([^"]+)", h1: "([^"]+)"[\s\S]*?primaryKeyword: "([^"]+)"/g)].map(([, path, title, h1, primaryKeyword]) => ({ path, title, h1, primaryKeyword }));
const failures = [];
for (const field of ["metricSource", "metricScope", "metricCheckedAt", "pageType", "status"]) if (!source.includes(field)) failures.push(`Missing SEO field: ${field}`);
for (const key of ["path", "title", "h1", "primaryKeyword"]) { const seen = new Set(); for (const page of pages) { if (seen.has(page[key])) failures.push(`Duplicate ${key}: ${page[key]}`); seen.add(page[key]); } }
if (!pages.length) failures.push("No SEO pages found.");
if (failures.length) { console.error(failures.join("\n")); process.exit(1); }
console.log(`SEO audit passed for ${pages.length} canonical pages.`);
