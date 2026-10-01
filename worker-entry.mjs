import app from "./.open-next/worker.js";
import { handleImportQueue } from "./import-queue-consumer.mjs";
import { handleCustomerFileCleanup } from "./customer-file-cleanup.mjs";
import { handleRetentionCleanup } from "./retention-cleanup.mjs";
export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from "./.open-next/worker.js";

export default {
  fetch(request, env, ctx) {
    return app.fetch(request, env, ctx);
  },
  queue: handleImportQueue,
  scheduled(_controller, env, ctx) {
    ctx.waitUntil(Promise.all([
      handleCustomerFileCleanup(env),
      handleRetentionCleanup(env),
    ]));
  },
};
