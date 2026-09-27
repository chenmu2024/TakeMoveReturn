import assert from "node:assert/strict";
import { test } from "node:test";
import { hashWorkerPin, verifyWorkerPin } from "../src/lib/security/worker-pin.ts";

test("worker PIN hash accepts only the original six digits and pepper", async () => {
  const stored = await hashWorkerPin("482719", "test-pepper-not-for-production");
  assert.equal(stored.iterations, 600_000);
  assert.equal(await verifyWorkerPin("482719", "test-pepper-not-for-production", stored), true);
  assert.equal(await verifyWorkerPin("482710", "test-pepper-not-for-production", stored), false);
  assert.equal(await verifyWorkerPin("482719", "other-pepper", stored), false);
  await assert.rejects(() => hashWorkerPin("12345", "test-pepper-not-for-production"));
});
