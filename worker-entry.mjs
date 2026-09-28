import app from "./.open-next/worker.js";
import { handleImportQueue } from "./import-queue-consumer.mjs";
export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from "./.open-next/worker.js";

export default {
  fetch(request, env, ctx) {
    return app.fetch(request, env, ctx);
  },
  queue: handleImportQueue,
};
