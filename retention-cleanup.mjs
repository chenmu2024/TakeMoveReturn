async function rpc(env, name, body = {}) {
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

export async function handleRetentionCleanup(env) {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error(JSON.stringify({ event: "retention_cleanup_skipped", reason: "supabase-admin-missing" }));
    return { skipped: "supabase-admin-missing" };
  }
  try {
    const deleted = await rpc(env, "run_retention_cleanup");
    console.log(JSON.stringify({ event: "retention_cleanup_completed", deleted }));
    return { deleted };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown retention cleanup error";
    console.error(JSON.stringify({ event: "retention_cleanup_failed", message: message.slice(0, 300) }));
    throw error;
  }
}
