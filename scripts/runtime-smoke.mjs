import { spawn } from "node:child_process";

const port = 3210;
const origin = `http://127.0.0.1:${port}`;
const env = {
  ...process.env,
  NODE_ENV: "production",
  NEXT_PUBLIC_SITE_URL: "https://takemovereturn.com",
  SUPABASE_AUTH_ENABLED: "false",
  WAFFO_BILLING_ENABLED: "false",
};

const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-H", "127.0.0.1", "-p", String(port)], {
  env,
  stdio: ["ignore", "pipe", "pipe"],
});

let output = "";
server.stdout.on("data", (chunk) => { output += chunk.toString(); });
server.stderr.on("data", (chunk) => { output += chunk.toString(); });

async function waitForServer() {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(origin + "/api/health", { redirect: "manual" });
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error("Next production server did not become ready.\n" + output);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function request(path, options = {}) {
  return fetch(origin + path, { redirect: "manual", ...options });
}

try {
  await waitForServer();

  const publicRoutes = [
    "/",
    "/features",
    "/pricing",
    "/help",
    "/construction-equipment-management-software",
    "/construction-equipment-tracking-software",
    "/tool-management-software",
    "/tool-inventory-software",
    "/construction-asset-tracking-software",
    "/asset-tagging-system",
    "/equipment-checkout",
    "/construction-equipment-maintenance-software",
    "/blog/how-to-manage-construction-site-inventory",
  ];

  for (const path of publicRoutes) {
    const response = await request(path);
    assert(response.status === 200, `${path} expected 200, got ${response.status}`);
    assert(response.headers.get("x-content-type-options") === "nosniff", `${path} missing nosniff`);
    assert(response.headers.get("x-frame-options") === "DENY", `${path} missing frame denial`);
  }

  const health = await request("/api/health");
  assert(health.status === 200, `/api/health expected 200, got ${health.status}`);
  const healthJson = await health.json();
  assert(healthJson.status === "ok" && healthJson.service === "takemovereturn", "health payload mismatch");
  assert((health.headers.get("cache-control") ?? "").includes("no-store"), "health endpoint must be no-store");
  assert((health.headers.get("x-robots-tag") ?? "").includes("noindex"), "health endpoint must be noindex");

  const dashboard = await request("/app/dashboard");
  assert([303, 307, 308].includes(dashboard.status), `guest dashboard expected redirect, got ${dashboard.status}`);
  assert((dashboard.headers.get("location") ?? "").includes("/auth/signup"), "guest dashboard must redirect to signup when auth is disabled");
  assert((dashboard.headers.get("cache-control") ?? "").includes("no-store"), "workspace redirect must be no-store");
  assert((dashboard.headers.get("x-robots-tag") ?? "").includes("noindex"), "workspace must be noindex");

  const fieldFind = await request("/field/find?code=TM-0184");
  assert([303, 307, 308].includes(fieldFind.status), `guest tool-code lookup expected redirect, got ${fieldFind.status}`);
  assert((fieldFind.headers.get("location") ?? "").includes("/field"), "guest tool-code lookup must require field access");

  const labels = await request("/app/tools/labels");
  assert([303, 307, 308].includes(labels.status), `guest batch labels expected redirect, got ${labels.status}`);
  assert((labels.headers.get("location") ?? "").includes("/auth/signup"), "guest batch labels must require workspace access");

  const authAliases = [
    ["/login", "/auth/login"],
    ["/signup", "/auth/signup"],
    ["/forgot-password", "/auth/forgot-password"],
  ];
  for (const [alias, destination] of authAliases) {
    const response = await request(alias);
    assert([303, 307, 308].includes(response.status), `${alias} expected redirect, got ${response.status}`);
    assert((response.headers.get("location") ?? "").includes(destination), `${alias} must redirect to ${destination}`);
    assert((response.headers.get("cache-control") ?? "").includes("no-store"), `${alias} must be no-store`);
    assert((response.headers.get("x-robots-tag") ?? "").includes("noindex"), `${alias} must be noindex`);
  }
  for (const path of ["/auth/login", "/auth/signup", "/auth/forgot-password"]) {
    const response = await request(path);
    assert(response.status === 200, `${path} expected 200, got ${response.status}`);
    assert((response.headers.get("cache-control") ?? "").includes("no-store"), `${path} must be no-store`);
    assert((response.headers.get("x-robots-tag") ?? "").includes("noindex"), `${path} must be noindex`);
  }

  const privacyExport = await request("/api/privacy/export");
  assert(privacyExport.status === 503, `privacy export without auth config expected 503, got ${privacyExport.status}`);
  assert((privacyExport.headers.get("cache-control") ?? "").includes("no-store"), "API must be no-store");
  assert((privacyExport.headers.get("x-robots-tag") ?? "").includes("noindex"), "API must be noindex");

  const sitemap = await request("/sitemap.xml");
  assert(sitemap.status === 200, `sitemap expected 200, got ${sitemap.status}`);
  const sitemapText = await sitemap.text();
  assert(sitemapText.includes("https://takemovereturn.com/"), "sitemap must use production canonical");
  assert(!sitemapText.includes("chatgpt.site") && !sitemapText.includes("workers.dev"), "sitemap contains a non-production host");
  assert(!sitemapText.includes("/app/") && !sitemapText.includes("/api/") && !sitemapText.includes("/q/"), "sitemap contains private routes");

  const robots = await request("/robots.txt");
  assert(robots.status === 200, `robots expected 200, got ${robots.status}`);
  const robotsText = await robots.text();
  for (const path of ["/app/", "/api/", "/q/", "/auth/", "/field/"]) {
    assert(robotsText.includes(`Disallow: ${path}`), `robots missing ${path}`);
  }

  const missing = await request("/this-route-does-not-exist");
  assert(missing.status === 404, `missing route expected 404, got ${missing.status}`);
  const missingHtml = await missing.text();
  assert(/page not found|not on the tool list/i.test(missingHtml), "missing route is not using the branded 404");

  console.log(`Runtime smoke passed for ${publicRoutes.length} public routes plus auth, private-route, health, sitemap, robots and 404 checks.`);
} finally {
  server.kill("SIGTERM");
  await new Promise((resolve) => {
    const timer = setTimeout(resolve, 3_000);
    server.once("exit", () => { clearTimeout(timer); resolve(); });
  });
}
