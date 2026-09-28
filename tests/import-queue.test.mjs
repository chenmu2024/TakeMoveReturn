import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { handleImportQueue } from "../import-queue-consumer.mjs";

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });
const jobId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const env = { NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "test-key" };
function message(body) {
  const events = [];
  return { body, events, ack() { events.push("ack"); }, retry() { events.push("retry"); } };
}

test("queue acknowledges a successful batch RPC", async () => {
  const item = message({ jobId, batchNumber: 0 });
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "https://example.supabase.co/rest/v1/rpc/process_import_batch");
    assert.deepEqual(JSON.parse(options.body), { p_job_id: jobId, p_batch_number: 0 });
    return { ok: true };
  };
  await handleImportQueue({ queue: "takemovereturn-import", messages: [item] }, env);
  assert.deepEqual(item.events, ["ack"]);
});

test("queue retries failed RPC and missing credentials without acknowledging", async () => {
  const failed = message({ jobId, batchNumber: 1 });
  const missing = message({ jobId, batchNumber: 2 });
  globalThis.fetch = async () => ({ ok: false, status: 503 });
  await handleImportQueue({ queue: "takemovereturn-import", messages: [failed] }, env);
  await handleImportQueue({ queue: "takemovereturn-import", messages: [missing] }, {});
  assert.deepEqual(failed.events, ["retry"]);
  assert.deepEqual(missing.events, ["retry"]);
});

test("queue discards malformed messages without calling the database", async () => {
  const item = message({ jobId: "not-a-job", batchNumber: 0 });
  globalThis.fetch = async () => { throw new Error("Unexpected fetch"); };
  await handleImportQueue({ queue: "takemovereturn-import", messages: [item] }, env);
  assert.deepEqual(item.events, ["ack"]);
});
