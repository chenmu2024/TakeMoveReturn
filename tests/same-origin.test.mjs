import assert from "node:assert/strict";
import test from "node:test";
import { isSameOrigin } from "../src/lib/security/same-origin.ts";

test("import actions accept only their own origin on production and preview hosts", () => {
  for (const origin of ["https://takemovereturn.com", "https://f0acf5bd-takemovereturn.zhongqiaosheng.workers.dev"]) {
    assert.equal(isSameOrigin(new Request(`${origin}/api/import/jobs`, { headers: { origin } })), true);
    assert.equal(isSameOrigin(new Request(`${origin}/api/import/jobs`)), false);
    assert.equal(isSameOrigin(new Request(`${origin}/api/import/jobs`, { headers: { origin: "https://attacker.example" } })), false);
  }
});
