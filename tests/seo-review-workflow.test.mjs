import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("SEO review notification handles existing and missing issues", async () => {
  const source = readFileSync(new URL("../.github/workflows/seo-review.yml", import.meta.url), "utf8").replace(/\r\n/g, "\n");
  const script = source.split("script: |\n")[1].split("\n").map((line) => line.replace(/^            /, "")).join("\n");
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  const run = new AsyncFunction("github", "context", "core", "require", script);
  for (const existing of [true, false]) {
    const calls = [];
    await run({ rest: { issues: {
      listForRepo: async () => ({ data: existing ? [{ title: "Scheduled SEO audit requires review", number: 42 }] : [] }),
      createComment: async (value) => calls.push({ kind: "comment", ...value }),
      create: async (value) => calls.push({ kind: "issue", ...value }),
    } } }, { repo: { owner: "test", repo: "test" } }, { setFailed: (message) => calls.push({ kind: "failed", message }) }, () => ({ readFileSync: () => "test audit report" }));
    assert.equal(calls[0].kind, existing ? "comment" : "issue");
    if (existing) assert.equal(calls[0].issue_number, 42);
    assert.ok(calls[0].body.includes("test audit report"));
    assert.equal(calls[1].kind, "failed");
  }
});
