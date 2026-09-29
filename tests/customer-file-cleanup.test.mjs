import assert from "node:assert/strict";
import test from "node:test";
import { handleCustomerFileCleanup } from "../customer-file-cleanup.mjs";

test("customer file cleanup is a no-op before the dedicated R2 binding exists", async () => {
  assert.deepEqual(await handleCustomerFileCleanup({}), { skipped: "bucket-not-bound" });
});

test("customer file cleanup removes queued objects and records completion", async () => {
  const originalFetch = globalThis.fetch;
  const rpcCalls = [];
  const deleted = [];

  globalThis.fetch = async (url, options) => {
    const href = String(url);
    rpcCalls.push({ href, body: options?.body ? JSON.parse(String(options.body)) : null });
    if (href.endsWith("/customer_file_cleanup_batch")) {
      return new Response(JSON.stringify([{
        file_id: "11111111-1111-4111-8111-111111111111",
        object_key: "company/tool_photo/object",
      }]), { status: 200, headers: { "content-type": "application/json" } });
    }
    if (href.endsWith("/record_customer_file_object_cleanup")) {
      return new Response("", { status: 204 });
    }
    return new Response("not found", { status: 404 });
  };

  try {
    const result = await handleCustomerFileCleanup({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "test-service-role",
      CUSTOMER_FILES_R2_BUCKET: {
        async delete(key) { deleted.push(key); },
      },
    });
    assert.deepEqual(result, { cleaned: 1, failed: 0 });
    assert.deepEqual(deleted, ["company/tool_photo/object"]);
    assert.equal(rpcCalls.length, 2);
    assert.equal(rpcCalls[1].body.p_succeeded, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
