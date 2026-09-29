async function rpc(env, name, body) {
  const response = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${name} returned ${response.status}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}

export async function handleCustomerFileCleanup(env) {
  if (!env.CUSTOMER_FILES_R2_BUCKET) return { skipped: "bucket-not-bound" };
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error(JSON.stringify({ event: "customer_file_cleanup_skipped", reason: "supabase-admin-missing" }));
    return { skipped: "supabase-admin-missing" };
  }

  let cleaned = 0;
  let failed = 0;
  const rows = await rpc(env, "customer_file_cleanup_batch", { p_limit: 100 });

  for (const row of Array.isArray(rows) ? rows : []) {
    if (typeof row?.file_id !== "string" || typeof row?.object_key !== "string") continue;
    try {
      await env.CUSTOMER_FILES_R2_BUCKET.delete(row.object_key);
      await rpc(env, "record_customer_file_object_cleanup", {
        p_file_id: row.file_id,
        p_succeeded: true,
        p_error: null,
      });
      cleaned++;
    } catch (error) {
      failed++;
      const message = error instanceof Error ? error.message : "Unknown object cleanup error";
      console.error(JSON.stringify({ event: "customer_file_cleanup_failed", fileId: row.file_id, message: message.slice(0, 300) }));
      try {
        await rpc(env, "record_customer_file_object_cleanup", {
          p_file_id: row.file_id,
          p_succeeded: false,
          p_error: message,
        });
      } catch {}
    }
  }

  if (cleaned || failed) console.log(JSON.stringify({ event: "customer_file_cleanup_completed", cleaned, failed }));
  return { cleaned, failed };
}
