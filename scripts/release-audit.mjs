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
const billingWebhook = read("src/app/api/billing/webhook/route.ts");
const billingChange = read("src/app/api/billing/change-plan/route.ts");
const billingCancel = read("src/app/api/billing/cancel/route.ts");
const billingReactivate = read("src/app/api/billing/reactivate/route.ts");
const billingLifecycleMigration = read("supabase/migrations/202609290002_billing_lifecycle.sql");
const memberMigration = read("supabase/migrations/202609290003_workspace_member_management.sql");
const customerFilesMigration = read("supabase/migrations/202609290004_customer_files.sql");
const customerFileLifecycleMigration = read("supabase/migrations/202609300001_customer_file_lifecycle.sql");
const customerFileCleanup = read("customer-file-cleanup.mjs");
const retentionCleanup = read("retention-cleanup.mjs");
const finishHardeningMigration = read("supabase/migrations/202610010001_finish_hardening.sql");
const privacyRetentionMigration = read("supabase/migrations/202610010002_privacy_retention.sql");
const fieldActions = read("src/app/field/actions.ts");
const scanPage = read("src/app/q/[token]/page.tsx");
const toolDetail = read("src/app/app/tools/[id]/page.tsx");
const maintenancePage = read("src/app/app/maintenance/page.tsx");
const turnstile = read("src/lib/security/turnstile.ts");
const workerEntry = read("worker-entry.mjs");
const customerFilesHelper = read("src/lib/files/customer-files.ts");
const customerFilesUpload = read("src/app/api/files/upload/route.ts");
const customerFilesRead = read("src/app/api/files/[id]/route.ts");
const customerFilesDelete = read("src/app/api/files/[id]/delete/route.ts");
const authCallback = read("src/app/auth/callback/route.ts");
const authActions = read("src/app/auth/actions.ts");
const adminClient = read("src/lib/supabase/admin.ts");
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
pass("pricing storage copy follows the customer-file feature gate", pricing.includes("customerFilesEnabled") && pricing.includes("private file storage") && pricing.includes("feature remains disabled"));
pass("workspace billing discloses pending webhook activation", workspace.includes('notice === "payment-pending"') && workspace.includes("pending a valid signed Waffo event"));
pass("workspace billing follows the customer-file feature gate", workspace.includes("fileStorageActive") && workspace.includes("Private tool photos") && workspace.includes("Customer-file uploads are staged but not enabled"));
pass("development secret template contains Waffo and no Stripe leftovers", devVars.includes("WAFFO_PRIVATE_KEY=") && !/STRIPE_/i.test(devVars));
pass("help content does not claim billing is deferred", !/payment setup is deferred|paid changes remain unavailable/i.test(help));
pass("legacy dist output is ignored", gitignore.split(/\r?\n/).includes("dist/"));
pass("legacy dist output is not tracked in the working tree", !existsSync(new URL("../dist", import.meta.url)));
pass("active runtime source has no legacy Fieldmark brand", !/\bFieldmark\b/i.test(sourceFiles));
pass("active runtime source has no legacy chatgpt.site canonical", !/chatgpt\.site/i.test(sourceFiles));
pass("robots excludes auth and field surfaces", robots.includes('"/auth/"') && robots.includes('"/field/"') && robots.includes('"/app/"') && robots.includes('"/api/"'));
pass("sensitive routes are no-store and noindex by header", nextConfig.includes('"Cache-Control", value: "private, no-store, max-age=0, must-revalidate"') && nextConfig.includes('"X-Robots-Tag", value: "noindex, nofollow, noarchive"') && ["/app/:path*", "/auth/:path*", "/field/:path*", "/q/:path*", "/api/:path*"].every((path) => nextConfig.includes(`source: "${path}"`)));
pass("billing UI checks entitlement mismatch", workspace.includes("subscription plan does not match the workspace entitlement"));
pass("billing UI exposes lifecycle actions without optimistic entitlement", workspace.includes('action="/api/billing/change-plan"') && workspace.includes('action="/api/billing/cancel"') && workspace.includes('action="/api/billing/reactivate"') && workspace.includes("signed Waffo webhook confirms the change"));
pass("billing lifecycle routes remain owner-scoped", [billingChange, billingCancel, billingReactivate].every((source) => source.includes('.eq("role", "owner")')));
pass("new checkout binds Waffo customer identity", read("src/app/api/billing/checkout/route.ts").includes("checkout.authenticated.create") && read("src/app/api/billing/checkout/route.ts").includes("buyerIdentity: auth.user.email"));
pass("plan changes use provider timing and idempotency", billingChange.includes("createPlanChangeSession") || billingChange.includes("createPlanChange"));
pass("webhook handles plan-change and recurring lifecycle events", ["subscription.plan_changed", "subscription.plan_change_scheduled", "subscription.plan_change_failed", "subscription.uncanceled", "subscription.past_due", "subscription.canceled"].every((event) => billingWebhook.includes(event)));
pass("billing lifecycle migration is provider-authoritative and service-role only", billingLifecycleMigration.includes("create table public.billing_plan_change_intents") && billingLifecycleMigration.includes("apply_waffo_plan_change_event") && billingLifecycleMigration.includes("apply_waffo_subscription_lifecycle_event") && billingLifecycleMigration.includes("to service_role"));
pass("rollback-only billing lifecycle database test exists", existsSync(new URL("../supabase/tests/billing_lifecycle.sql", import.meta.url)));
pass("public billing copy no longer claims lifecycle self-service is absent", !legal.includes("self-service upgrade, downgrade and cancellation are not yet available") && !help.includes("require billing support for plan changes or cancellation"));
pass("workspace member management replaces the placeholder", !workspace.includes("Membership management is not yet available") && workspace.includes("Create invitation") && workspace.includes("Deactivate") && workspace.includes("Reactivate"));
pass("administrator limits are enforced in the database", ["when 'free' then 1", "when 'starter' then 2", "when 'growth' then 5", "when 'pro' then 10"].every((value) => memberMigration.includes(value)) && memberMigration.includes("Admin limit reached"));
pass("pending invitations reserve seats and access changes are audited", memberMigration.includes("workspace_access_audit") && memberMigration.includes("v_active + v_pending >= v_limit") && memberMigration.includes("invitation_accepted") && memberMigration.includes("member_deactivated"));
pass("workspace invitations require owner mutation authority and protect owner access", memberMigration.includes("role = 'owner'") && memberMigration.includes("Owner access cannot be removed here") && memberMigration.includes("User already belongs to another workspace"));
pass("invitation acceptance is bound to authenticated email and legal consent", memberMigration.includes("Invitation email does not match this account") && memberMigration.includes("Current terms acceptance required"));
pass("Supabase admin client is server-only and invitation callback supports invite tokens", adminClient.includes('import "server-only"') && authCallback.includes('tokenType === "invite"') && authActions.includes("update-password-invitation"));
pass("member management rollback-only database test exists", existsSync(new URL("../supabase/tests/workspace_member_management.sql", import.meta.url)));
pass("customer-file activation requires dedicated R2 binding", !wrangler.includes('"CUSTOMER_FILES_ENABLED": "true"') || wrangler.includes('"binding": "CUSTOMER_FILES_R2_BUCKET", "bucket_name": "takemovereturn-files"'));
pass("OpenNext cache R2 remains separate from future customer files", wrangler.includes("NEXT_INC_CACHE_R2_BUCKET") && wrangler.includes("takemovereturn-opennext-cache"));
pass("customer-file migration enforces metadata RLS and plan quotas", customerFilesMigration.includes("create table public.customer_files") && customerFilesMigration.includes("enable row level security") && customerFilesMigration.includes("reserve_customer_file") && ["104857600","2147483648","10737418240","26843545600"].every((value) => customerFilesMigration.includes(value)));
pass("customer-file metadata writes remain RPC-controlled", customerFilesMigration.includes("revoke all on public.customer_files from public, anon, authenticated") && customerFilesMigration.includes("grant select on public.customer_files to authenticated"));
pass("customer-file upload validates size, MIME and file signature", customerFilesHelper.includes("10 * 1024 * 1024") && customerFilesHelper.includes("detectCustomerFileType") && customerFilesUpload.includes("detectCustomerFileType(bytes) !== validated.type"));
pass("customer files are served only through authenticated gated routes", customerFilesRead.includes("getClaims()") && customerFilesRead.includes('eq("status", "ready")') && customerFilesRead.includes('"Cache-Control": "private, no-store, max-age=0"'));
pass("customer-file delete is authenticated and metadata-led", customerFilesDelete.includes("getClaims()") && customerFilesDelete.includes('rpc("delete_customer_file"') && customerFilesDelete.includes("customer_file_r2_delete_failed"));
pass("rollback-only customer-file security test exists", existsSync(new URL("../supabase/tests/customer_files.sql", import.meta.url)));
pass("customer-file object cleanup state is durable and service-role controlled", customerFileLifecycleMigration.includes("object_deleted_at") && customerFileLifecycleMigration.includes("customer_file_cleanup_batch") && customerFileLifecycleMigration.includes("record_customer_file_object_cleanup") && customerFileLifecycleMigration.includes("to service_role"));
pass("customer-file parent deletes are guarded until objects are purged", customerFileLifecycleMigration.includes("prevent_parent_delete_with_live_customer_files") && ["companies_customer_file_delete_guard","tools_customer_file_delete_guard","damage_reports_customer_file_delete_guard","maintenance_events_customer_file_delete_guard"].every((value) => customerFileLifecycleMigration.includes(value)));
pass("customer-file cleanup is scheduled but safely no-ops without the dedicated bucket", wrangler.includes('"triggers": { "crons": ["17 4 * * *"] }') && workerEntry.includes("handleCustomerFileCleanup") && customerFileCleanup.includes('if (!env.CUSTOMER_FILES_R2_BUCKET) return { skipped: "bucket-not-bound" }'));
pass("private file responses are hardened against active content", customerFilesRead.includes("Content-Security-Policy") && customerFilesRead.includes("Cross-Origin-Resource-Policy") && customerFilesRead.includes('record.content_type === "application/pdf" ? "attachment" : "inline"'));
pass("storage UI warns before quota exhaustion", workspace.includes("storageRatio >= 0.8") && workspace.includes("uploads are blocked"));
pass("customer-file cleanup tests exist", existsSync(new URL("../tests/customer-file-cleanup.test.mjs", import.meta.url)) && existsSync(new URL("../supabase/tests/customer_file_lifecycle.sql", import.meta.url)));
pass("invitation acceptance page exists", existsSync(new URL("../src/app/app/invitations/page.tsx", import.meta.url)));
pass("route error recovery boundary exists", existsSync(new URL("../src/app/error.tsx", import.meta.url)));
pass("global error fallback exists", existsSync(new URL("../src/app/global-error.tsx", import.meta.url)));
pass("health endpoint exists", existsSync(new URL("../src/app/api/health/route.ts", import.meta.url)));
pass("runtime smoke audit exists", existsSync(new URL("../scripts/runtime-smoke.mjs", import.meta.url)) && packageJson.scripts?.["runtime:smoke"] === "node scripts/runtime-smoke.mjs");
pass("CI runs production runtime smoke after build", ci.includes("npm run build") && ci.includes("npm run runtime:smoke") && ci.indexOf("npm run runtime:smoke") > ci.indexOf("npm run build"));
pass("CI runs Cloudflare deployment dry-run", ci.includes("npm run cf:dry-run") && packageJson.scripts?.["cf:dry-run"] === "wrangler deploy --dry-run");
pass("CI runs baseline public load smoke", ci.includes("npm run load:smoke") && packageJson.scripts?.["load:smoke"] === "node scripts/load-smoke.mjs" && existsSync(new URL("../scripts/load-smoke.mjs", import.meta.url)));
pass("scheduled SEO review workflow exists", existsSync(new URL("../.github/workflows/seo-review.yml", import.meta.url)));
pass("dependency update automation exists", existsSync(new URL("../.github/dependabot.yml", import.meta.url)));
pass("security reporting policy exists", existsSync(new URL("../SECURITY.md", import.meta.url)));
pass("browser hardening headers include COOP and CORP", nextConfig.includes("Cross-Origin-Opener-Policy") && nextConfig.includes("Cross-Origin-Resource-Policy") && nextConfig.includes("X-DNS-Prefetch-Control"));
pass("company-local expected return dates are database-authoritative", finishHardeningMigration.includes("expected_return_date date") && finishHardeningMigration.includes("p_due_date date") && finishHardeningMigration.includes("at time zone v_timezone"));
pass("customer file cardinality and image limits are database-enforced", finishHardeningMigration.includes("Tool already has an active primary image") && finishHardeningMigration.includes("Damage reports allow up to 3 photos") && finishHardeningMigration.includes("Maintenance events allow up to 3 attachments") && finishHardeningMigration.includes("5242880"));
pass("field QR flow includes authenticated damage and missing reports", fieldActions.includes("reportFieldIssue") && scanPage.includes("Report damage") && scanPage.includes("Report missing") && finishHardeningMigration.includes("report_field_tool_issue"));
pass("tool history is paginated and corrections append audit events", toolDetail.includes("Complete history") && toolDetail.includes("correctToolCustody") && finishHardeningMigration.includes("reverses_transaction_id"));
pass("lightweight work orders are implemented through manager RPCs", finishHardeningMigration.includes("create table if not exists public.work_orders") && maintenancePage.includes("Work orders") && maintenancePage.includes("setWorkOrderStatus"));
pass("Turnstile is verified server-side before public auth actions when configured", turnstile.includes("siteverify") && authActions.includes("verifyTurnstile(form)") && devVars.includes("TURNSTILE_REQUIRED=false"));
pass("privacy fulfilment and retention cleanup are service-role controlled", privacyRetentionMigration.includes("fulfill_account_deletion") && privacyRetentionMigration.includes("run_retention_cleanup") && retentionCleanup.includes("run_retention_cleanup") && workerEntry.includes("handleRetentionCleanup"));
pass("new hardening rollback tests exist", existsSync(new URL("../supabase/tests/finish_hardening.sql", import.meta.url)) && existsSync(new URL("../supabase/tests/privacy_retention.sql", import.meta.url)));

if (failures.length) {
  console.error(`\nRelease audit failed: ${failures.join("; ")}`);
  process.exit(1);
}
console.log("\nRelease audit passed.");
