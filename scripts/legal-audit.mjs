import { readFileSync } from "node:fs";

const route = readFileSync(new URL("../src/app/[...slug]/page.tsx", import.meta.url), "utf8");
const documents = readFileSync(new URL("../src/data/legal-documents.ts", import.meta.url), "utf8");
const providers = readFileSync(new URL("../src/data/subprocessors.ts", import.meta.url), "utf8");
const footer = readFileSync(new URL("../src/components/marketing.tsx", import.meta.url), "utf8");
const schema = readFileSync(new URL("../src/components/seo-schema.tsx", import.meta.url), "utf8");
const config = readFileSync(new URL("../src/config/site.ts", import.meta.url), "utf8");
const paths = ["privacy", "terms", "dpa", "subprocessors", "business-information"];
const checks = [
  ...paths.map((path) => [path, route.includes(`${path}: {`) || route.includes(`"${path}": {`)]),
  ...paths.map((path) => [`footer ${path}`, footer.includes(`href="/${path}"`)]),
  ["draft legal noindex", paths.every((path) => route.includes(`"${path}"`)) && route.includes("index: false")],
  ["privacy/terms/DPA content", ["privacy:", "terms:", "dpa:"].every((marker) => documents.includes(marker))],
  ["active provider register", ["Cloudflare", "Supabase", "Resend"].every((name) => providers.includes(`name: "${name}"`))],
  ["no false organization schema", !schema.includes('"@type": "Organization"')],
];
for (const [label, passed] of checks) console.log(`${passed ? "PASS" : "FAIL"} ${label}`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;

if (process.argv.includes("--production")) {
  const required = ["LEGAL_OPERATOR_NAME", "REGISTERED_ADDRESS", "SUPPORT_EMAIL", "PRIVACY_CONTACT_EMAIL", "LEGAL_REVIEW_APPROVED", "REFUND_POLICY_APPROVED", "DISPUTE_RESOLUTION_VENUE", "DATA_PROCESSING_LOCATIONS_REVIEWED", "INTERNATIONAL_TRANSFERS_REVIEWED"];
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length) {
    console.error(`LEGAL_REVIEW_REQUIRED: ${missing.join(", ")}`);
    process.exitCode = 1;
  }
  if (config.includes('legalReviewStatus: "draft"')) {
    console.error("LEGAL_REVIEW_REQUIRED: legal configuration remains draft");
    process.exitCode = 1;
  }
}
