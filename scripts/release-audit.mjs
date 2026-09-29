import { existsSync, readFileSync } from "node:fs";

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

const failures = [];
const pass = (label, ok) => {
  console.log(`${ok ? "PASS" : "FAIL"} ${label}`);
  if (!ok) failures.push(label);
};

const wrangler = read("wrangler.jsonc");
const legal = read("src/data/legal-documents.ts");
const providers = read("src/data/subprocessors.ts");
const pricing = read("src/components/pricing-cards.tsx");
const workspace = read("src/components/workspace.tsx");
const devVars = read(".dev.vars.example");
const help = read("src/data/help-articles.ts");
const gitignore = read(".gitignore");
const sourceFiles = [
  "src/app/page.tsx",
  "src/app/layout.tsx",
  "src/app/[...slug]/page.tsx",
  "src/components/marketing.tsx",
  "src/components/workspace.tsx",
  "src/data/legal-documents.ts",
  "src/data/subprocessors.ts",
  "src/config/site.ts",
].map(read).join("\n");

pass("production billing gate is enabled in tracked Cloudflare config", wrangler.includes('"WAFFO_BILLING_ENABLED": "true"'));
pass("active billing has matching public disclosure", legal.includes("Paid checkout is available through Waffo Pancake") && !legal.includes("Paid checkout is disabled") && !legal.includes("Paid checkout is not live"));
pass("Waffo appears in the active provider register", providers.includes('name: "Waffo"') && providers.includes('status: "active"'));
pass("pricing discloses unavailable customer-file uploads", pricing.includes("customer-file uploads") && pricing.includes("not yet enabled"));
pass("workspace billing discloses pending webhook activation", workspace.includes('notice === "payment-pending"') && workspace.includes("pending a valid signed Waffo event"));
pass("workspace billing discloses current file-upload limitation", workspace.includes("Customer-file uploads are not yet enabled"));
pass("development secret template contains Waffo and no Stripe leftovers", devVars.includes("WAFFO_PRIVATE_KEY=") && !/STRIPE_/i.test(devVars));
pass("help content does not claim billing is deferred", !/payment setup is deferred|paid changes remain unavailable/i.test(help));
pass("legacy dist output is ignored", gitignore.split(/\r?\n/).includes("dist/"));
pass("legacy dist output is not tracked in the working tree", !existsSync(new URL("../dist", import.meta.url)));
pass("active runtime source has no legacy Fieldmark brand", !/\bFieldmark\b/i.test(sourceFiles));
pass("active runtime source has no legacy chatgpt.site canonical", !/chatgpt\.site/i.test(sourceFiles));
pass("route error recovery boundary exists", existsSync(new URL("../src/app/error.tsx", import.meta.url)));
pass("global error fallback exists", existsSync(new URL("../src/app/global-error.tsx", import.meta.url)));

if (failures.length) {
  console.error(`\nRelease audit failed: ${failures.join("; ")}`);
  process.exit(1);
}
console.log("\nRelease audit passed.");
