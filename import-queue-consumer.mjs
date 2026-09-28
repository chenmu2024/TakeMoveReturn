export async function handleImportQueue(batch, env) {
  if (batch.queue !== "takemovereturn-import") throw new Error("Unexpected queue");
  for (const message of batch.messages) {
    const { jobId, batchNumber } = message.body ?? {};
    if (typeof jobId !== "string" || !/^[0-9a-f-]{36}$/i.test(jobId)
      || !Number.isInteger(batchNumber) || batchNumber < 0 || batchNumber >= 50) {
      message.ack();
      continue;
    }
    if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      message.retry();
      continue;
    }
    try {
      const response = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/process_import_batch`, {
        method: "POST",
        headers: {
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ p_job_id: jobId, p_batch_number: batchNumber }),
      });
      if (!response.ok) {
        console.error(JSON.stringify({ event: "import_batch_failed", jobId, batchNumber, status: response.status }));
        message.retry();
      } else message.ack();
    } catch {
      console.error(JSON.stringify({ event: "import_batch_network_error", jobId, batchNumber }));
      message.retry();
    }
  }
}
