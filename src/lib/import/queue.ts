import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function dispatchImport(jobId: string, totalRows: number) {
  const env = (await getCloudflareContext({ async: true })).env as unknown as {
    IMPORT_QUEUE?: { sendBatch(messages: { body: { jobId: string; batchNumber: number } }[]): Promise<void> };
  };
  if (!env.IMPORT_QUEUE) throw new Error("Import queue is unavailable");
  const messages = Array.from({ length: Math.ceil(totalRows / 100) }, (_, batchNumber) => ({
    body: { jobId, batchNumber },
  }));
  await env.IMPORT_QUEUE.sendBatch(messages);
}
