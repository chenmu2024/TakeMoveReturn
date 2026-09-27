import assert from "node:assert/strict";
import { createHmac, pbkdf2Sync } from "node:crypto";
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

test("production PIN derivation sends only the peppered value to the authenticated KDF", async () => {
  const priorUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const priorSecret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const priorFetch = globalThis.fetch;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-server-key";
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "https://example.supabase.co/functions/v1/worker-pin-kdf");
    assert.equal(options.headers.apikey, "test-server-key");
    const body = JSON.parse(options.body);
    assert.equal(body.iterations, 600_000);
    assert.equal(options.body.includes("482719"), false);
    const expected = pbkdf2Sync(Buffer.from(body.peppered, "base64"), Buffer.from(body.salt, "base64"),
      body.iterations, 32, "sha256");
    assert.deepEqual(Buffer.from(body.peppered, "base64"),
      createHmac("sha256", "test-pepper-not-for-production").update("482719").digest());
    return Response.json({ hash: expected.toString("base64") });
  };
  try {
    const stored = await hashWorkerPin("482719", "test-pepper-not-for-production");
    assert.equal(await verifyWorkerPin("482719", "test-pepper-not-for-production", stored), true);
  } finally {
    globalThis.fetch = priorFetch;
    if (priorUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = priorUrl;
    if (priorSecret === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = priorSecret;
  }
});
