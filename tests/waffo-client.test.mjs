import assert from "node:assert/strict";
import { generateKeyPairSync, createVerify } from "node:crypto";
import test from "node:test";
import { waffoClient } from "../src/lib/billing/waffo.ts";

test("Waffo raw base64 private key signs a checkout request", async () => {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const previousMerchant = process.env.WAFFO_MERCHANT_ID;
  const previousKey = process.env.WAFFO_PRIVATE_KEY;
  const previousFetch = globalThis.fetch;
  process.env.WAFFO_MERCHANT_ID = "MER_1nlEgg0UD2PNj3UGzHWgUm";
  process.env.WAFFO_PRIVATE_KEY = privateKey.export({ type: "pkcs8", format: "der" }).toString("base64");
  try {
    let verified = false;
    globalThis.fetch = async (url, options) => {
      const path = new URL(url).pathname;
      const bodyHash = (await import("node:crypto")).createHash("sha256").update(options.body).digest("base64");
      const input = `POST\n${path}\n${options.headers["X-Timestamp"]}\n${bodyHash}`;
      const verify = createVerify("sha256");
      verify.update(input);
      verified = verify.verify(publicKey, options.headers["X-Signature"], "base64");
      return Response.json({ data: { sessionId: "SES_test", checkoutUrl: "https://pancake.waffo.ai/test", expiresAt: new Date().toISOString() } });
    };
    const client = waffoClient();
    assert.ok(client);
    await client.checkout.createSession({ productId: "PROD_6r7BgQwdISjVP4rSXOSKM2", currency: "USD" });
    assert.equal(verified, true);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousMerchant === undefined) delete process.env.WAFFO_MERCHANT_ID;
    else process.env.WAFFO_MERCHANT_ID = previousMerchant;
    if (previousKey === undefined) delete process.env.WAFFO_PRIVATE_KEY;
    else process.env.WAFFO_PRIVATE_KEY = previousKey;
  }
});
