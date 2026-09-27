import { readFileSync } from "node:fs";

const route = readFileSync(new URL("../src/app/[...slug]/page.tsx", import.meta.url), "utf8");
const documents = readFileSync(new URL("../src/data/legal-documents.ts", import.meta.url), "utf8");
const providers = readFileSync(new URL("../src/data/subprocessors.ts", import.meta.url), "utf8");
const footer = readFileSync(new URL("../src/components/marketing.tsx", import.meta.url), "utf8");
const schema = readFileSync(new URL("../src/components/seo-schema.tsx", import.meta.url), "utf8");
const config = readFileSync(new URL("../src/config/site.ts", import.meta.url), "utf8");
const review = readFileSync(new URL("../src/config/legal-review.ts", import.meta.url), "utf8");
const signup = readFileSync(new URL("../src/app/auth/actions.ts", import.meta.url), "utf8");
const signupForm = readFileSync(new URL("../src/components/auth-shell.tsx", import.meta.url), "utf8");
const acceptanceMigration = readFileSync(new URL("../supabase/migrations/202609250004_legal_acceptances.sql", import.meta.url), "utf8");
const paths = ["privacy", "terms", "dpa", "subprocessors", "business-information", "about"];
const checks = [
  ...paths.map((path) => [path, route.includes(`${path}: {`) || route.includes(`"${path}": {`)]),
  ...paths.map((path) => [`footer ${path}`, footer.includes(`href="/${path}"`)]),
  ["direct support email in footer", footer.includes('mailto:${siteConfig.supportEmail}')],
  ["direct contact email in footer", footer.includes('mailto:${siteConfig.contactEmail}')],
  ["refund conditions and billing contact", documents.includes('title: "6. Refunds and billing questions"') && documents.includes("duplicate or erroneous charge") && documents.includes("service was not delivered as described") && documents.includes("siteConfig.billingEmail")],
  ["terms use verified production address", documents.includes("service at https://takemovereturn.com") && !documents.includes("service at ${siteConfig.siteUrl}")],
  ["no development address in legal text", !/(?:localhost|127\.0\.0\.1|workers\.dev|chatgpt\.site|example\.com)/i.test(documents)],
  ["legal noindex", ["privacy", "terms", "dpa", "subprocessors", "business-information"].every((path) => route.includes(`"${path}"`)) && route.includes("index: false")],
  ["privacy/terms/DPA content", ["privacy:", "terms:", "dpa:"].every((marker) => documents.includes(marker))],
  ["active provider register", ["Cloudflare", "Supabase", "Resend"].every((name) => providers.includes(`name: "${name}"`))],
  ["no false organization schema", !schema.includes('"@type": "Organization"')],
  ["confirmed individual operator", config.includes('operatorType: "individual"') && config.includes('registeredBusinessName: null')],
  ["public content has no engineering placeholders", !/\b(?:DRAFT|TBD|LEGAL REVIEW REQUIRED|FAKE ADDRESS)\b/i.test(route + documents)],
  ["internal review is separate", review.includes('method: "ai-assisted-internal-review"') && review.includes('externalProfessionalReview: "not-obtained"')],
  ["unselected signup consent", signupForm.includes('name="legal_consent"') && signupForm.includes('type="checkbox"') && !signupForm.includes('defaultChecked')],
  ["signup consent enforced on server", signup.includes('form.get("legal_consent") !== "yes"')],
  ["consent audit table", acceptanceMigration.includes("create table public.legal_acceptances") && acceptanceMigration.includes("enable row level security")],
];
for (const [label, passed] of checks) console.log(`${passed ? "PASS" : "FAIL"} ${label}`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;

if (process.argv.includes("--production")) {
  const required = ["PRIVACY_EMAIL_RECEIPT_VERIFIED", "DATA_PROCESSING_LOCATIONS_REVIEWED", "INTERNATIONAL_TRANSFERS_REVIEWED", "PRIVACY_REQUESTS_OPERATIONAL"];
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length) {
    console.error(`LEGAL_REVIEW_REQUIRED: ${missing.join(", ")}`);
    process.exitCode = 1;
  }
  if (config.includes('legalReviewStatus: "draft"')) {
    console.error("LEGAL_REVIEW_REQUIRED: formal registration acceptance remains disabled");
    process.exitCode = 1;
  }
}
