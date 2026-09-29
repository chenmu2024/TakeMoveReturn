import { spawn } from "node:child_process";
import { performance } from "node:perf_hooks";

const port = 3211;
const origin = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-H", "127.0.0.1", "-p", String(port)], {
  env: {
    ...process.env,
    NODE_ENV: "production",
    NEXT_PUBLIC_SITE_URL: "https://takemovereturn.com",
    SUPABASE_AUTH_ENABLED: "false",
    WAFFO_BILLING_ENABLED: "false",
  },
  stdio: ["ignore", "pipe", "pipe"],
});
let output = "";
server.stdout.on("data", (chunk) => { output += chunk.toString(); });
server.stderr.on("data", (chunk) => { output += chunk.toString(); });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForServer() {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(origin + "/api/health");
      if (response.ok) return;
    } catch {}
    await sleep(250);
  }
  throw new Error("Load-smoke server did not become ready.\n" + output);
}

function percentile(values, p) {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[index];
}

async function runPool(tasks, concurrency) {
  let cursor = 0;
  const workers = Array.from({ length: concurrency }, async () => {
    while (cursor < tasks.length) {
      const index = cursor++;
      await tasks[index]();
    }
  });
  await Promise.all(workers);
}

try {
  await waitForServer();
  const routes = ["/", "/pricing", "/construction-equipment-tracking-software", "/help"];
  const latencies = [];
  let success = 0;
  let failed = 0;
  const tasks = [];

  for (const route of routes) {
    for (let i = 0; i < 25; i++) {
      tasks.push(async () => {
        const started = performance.now();
        try {
          const response = await fetch(origin + route, { redirect: "manual" });
          await response.arrayBuffer();
          if (response.status === 200) success++;
          else failed++;
        } catch {
          failed++;
        } finally {
          latencies.push(performance.now() - started);
        }
      });
    }
  }

  await runPool(tasks, 10);
  const total = success + failed;
  const errorRate = total ? failed / total : 1;
  const metrics = {
    requests: total,
    success,
    failed,
    errorRate: Number((errorRate * 100).toFixed(2)),
    p50Ms: Math.round(percentile(latencies, 50)),
    p95Ms: Math.round(percentile(latencies, 95)),
    p99Ms: Math.round(percentile(latencies, 99)),
  };
  console.log(JSON.stringify(metrics, null, 2));
  if (total !== 100 || failed !== 0) {
    throw new Error(`Load smoke failed: ${failed}/${total} requests failed`);
  }
} finally {
  server.kill("SIGTERM");
  await new Promise((resolve) => {
    const timer = setTimeout(resolve, 3_000);
    server.once("exit", () => { clearTimeout(timer); resolve(); });
  });
}
