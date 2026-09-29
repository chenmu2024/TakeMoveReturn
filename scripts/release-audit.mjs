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
const robots = read("src/app/robots.ts");
const nextConfig = read("next.config.ts");
const packageJson = JSON.parse(read("package.json"));
const ci = read(".github/workflows/ci.yml");
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
pass("robots excludes auth and field surfaces", robots.includes('"/auth/"') && robots.includes('"/field/"') && robots.includes('"/app/"') && robots.includes('"/api/"'));
pass("sensitive routes are no-store and noindex by header", nextConfig.includes('"Cache-Control", value: "private, no-store, max-age=0, must-revalidate"') && nextConfig.includes('"X-Robots-Tag", value: "noindex, nofollow, noarchive"') && ["/app/:path*", "/auth/:path*", "/field/:path*", "/q/:path*", "/api/:path*"].every((path) => nextConfig.includes(`source: "${path}"`)));
pass("billing UI checks entitlement mismatch", workspace.includes("subscription plan does not match the workspace entitlement"));
pass("route error recovery boundary exists", existsSync(new URL("../src/app/error.tsx", import.meta.url)));
pass("global error fallback exists", existsSync(new URL("../src/app/global-error.tsx", import.meta.url)));
pass("health endpoint exists", existsSync(new URL("../src/app/api/health/route.ts", import.meta.url)));
pass("runtime smoke audit exists", existsSync(new URL("../scripts/runtime-smoke.mjs", import.meta.url)) && packageJson.scripts?.["runtime:smoke"] === "node scripts/runtime-smoke.mjs");
pass("CI runs production runtime smoke after build", ci.includes("npm run build") && ci.includes("npm run runtime:smoke") && ci.indexOf("npm run runtime:smoke") > ci.indexOf("npm run build"));
pass("CI runs Cloudflare deployment dry-run", ci.includes("npm run cf:dry-run") && packageJson.scripts?.["cf:dry-run"] === "wrangler deploy --dry-run");
pass("browser hardening headers include COOP and CORP", nextConfig.includes("Cross-Origin-Opener-Policy") && nextConfig.includes("Cross-Origin-Resource-Policy") && nextConfig.includes("X-DNS-Prefetch-Control"));

if (failures.length) {
  console.error(`\nRelease audit failed: ${failures.join("; ")}`);
  process.exit(1);
}
console.log("\nRelease audit passed.");
