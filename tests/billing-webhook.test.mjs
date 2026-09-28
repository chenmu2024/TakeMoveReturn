import assert from "node:assert/strict";
import test from "node:test";
import { POST } from "../src/app/api/billing/webhook/route.ts";

test("billing webhook rejects unsigned and forged requests", async () => {
  const unsigned = await POST(new Request("https://takemovereturn.com/api/billing/webhook", {
    method: "POST", body: "{}", headers: { "content-type": "application/json" },
  }));
  assert.equal(unsigned.status, 400);

  const forged = await POST(new Request("https://takemovereturn.com/api/billing/webhook", {
    method: "POST", body: "{}", headers: { "content-type": "application/json", "x-waffo-signature": "t=1,v1=forged" },
  }));
  assert.equal(forged.status, 401);
});

test("billing webhook rejects oversized request before parsing", async () => {
  const oversized = await POST(new Request("https://takemovereturn.com/api/billing/webhook", {
    method: "POST", body: "x".repeat(65537), headers: { "x-waffo-signature": "t=1,v1=forged" },
  }));
  assert.equal(oversized.status, 413);
});
