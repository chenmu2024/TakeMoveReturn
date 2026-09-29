import { readdirSync, readFileSync } from "node:fs";

const dir = new URL("../supabase/migrations/", import.meta.url);
const files = readdirSync(dir).filter((name) => name.endsWith(".sql")).sort();
const sources = files.map((name) => ({ name, text: readFileSync(new URL(name, dir), "utf8") }));
const combined = sources.map(({ name, text }) => `-- ${name}\n${text}`).join("\n");

const failures = [];
function check(label, ok) {
  console.log(`${ok ? "PASS" : "FAIL"} ${label}`);
  if (!ok) failures.push(label);
}

const tables = [...combined.matchAll(/create\s+table(?:\s+if\s+not\s+exists)?\s+public\.([a-z0-9_]+)/gi)].map((m) => m[1]);
for (const table of [...new Set(tables)]) {
  const rls = new RegExp(`alter\\s+table\\s+public\\.${table}\\s+enable\\s+row\\s+level\\s+security`, "i");
  check(`RLS enabled for public.${table}`, rls.test(combined));
}

const functionBlocks = [...combined.matchAll(/create(?:\s+or\s+replace)?\s+function\s+public\.([a-z0-9_]+)\s*\([^;]*?\)[\s\S]*?\$\$;/gi)];
for (const match of functionBlocks) {
  const name = match[1];
  const block = match[0];
  if (/security\s+definer/i.test(block)) {
    const hardenedInDefinition = /set\s+search_path\s*=\s*''/i.test(block);
    const hardenedByLaterMigration = new RegExp(`alter\\s+function\\s+public\\.${name}\\s*\\([^;]*?\\)\\s*set\\s+search_path\\s*=\\s*''`, "i").test(combined);
    const replacedByInvoker = new RegExp(`create\\s+or\\s+replace\\s+function\\s+public\\.${name}\\s*\\([^;]*?\\)[\\s\\S]*?security\\s+invoker[\\s\\S]*?set\\s+search_path\\s*=\\s*''`, "i").test(combined);
    check(`SECURITY DEFINER ${name} final search_path is hardened`, hardenedInDefinition || hardenedByLaterMigration || replacedByInvoker);
  }
}

check("no migration grants table-wide ALL to anon", !/grant\s+all\s+on\s+(?:table\s+)?public\.[^;]+\s+to\s+anon\b/i.test(combined));
check("no migration grants table-wide ALL to authenticated", !/grant\s+all\s+on\s+(?:table\s+)?public\.[^;]+\s+to\s+authenticated\b/i.test(combined));
check("billing event RPC remains service-role only", /grant\s+execute\s+on\s+function\s+public\.apply_waffo_subscription_event[\s\S]*?to\s+service_role/i.test(combined)
  && /revoke\s+all\s+on\s+function\s+public\.apply_waffo_subscription_event[\s\S]*?from\s+public,\s*anon,\s*authenticated/i.test(combined));
check("import batch RPC remains service-role only", /grant\s+execute\s+on\s+function\s+public\.process_import_batch[\s\S]*?to\s+service_role/i.test(combined)
  && /revoke\s+all\s+on\s+function\s+public\.process_import_batch[\s\S]*?from\s+public,\s*anon,\s*authenticated/i.test(combined));
check("plan-change webhook RPC remains service-role only", /grant\s+execute\s+on\s+function\s+public\.apply_waffo_plan_change_event[\s\S]*?to\s+service_role/i.test(combined)
  && /revoke\s+all\s+on\s+function\s+public\.apply_waffo_plan_change_event[\s\S]*?from\s+public,\s*anon,\s*authenticated/i.test(combined));
check("subscription lifecycle webhook RPC remains service-role only", /grant\s+execute\s+on\s+function\s+public\.apply_waffo_subscription_lifecycle_event[\s\S]*?to\s+service_role/i.test(combined)
  && /revoke\s+all\s+on\s+function\s+public\.apply_waffo_subscription_lifecycle_event[\s\S]*?from\s+public,\s*anon,\s*authenticated/i.test(combined));
check("workspace invitation mutations are never granted to anon", [
  "create_workspace_invitation",
  "revoke_workspace_invitation",
  "accept_workspace_invitation",
  "update_workspace_member_role",
  "set_workspace_member_active",
].every((name) => new RegExp(`revoke\\s+all\\s+on\\s+function\\s+public\\.${name}[\\s\\S]*?from\\s+public,\\s*anon`, "i").test(combined)));
check("member management keeps owner-only mutation guards", /create\s+function\s+public\.create_workspace_invitation[\s\S]*?m\.role\s*=\s*'owner'/i.test(combined)
  && /create\s+function\s+public\.set_workspace_member_active[\s\S]*?Owner access cannot be removed here/i.test(combined));

if (failures.length) {
  console.error(`\nDatabase audit failed: ${failures.join("; ")}`);
  process.exit(1);
}
console.log(`\nDatabase audit passed across ${files.length} migrations and ${new Set(tables).size} public tables.`);
