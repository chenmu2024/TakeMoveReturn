import { WaffoPancake } from "@waffo/pancake-ts";
import type { BillingInterval, PlanId } from "../../config/plans";

export function waffoProductId(plan: Exclude<PlanId, "free">, interval: BillingInterval) {
  const envName = `WAFFO_PRODUCT_${plan.toUpperCase()}_${interval === "month" ? "MONTHLY" : "ANNUAL"}`;
  return process.env[envName] || null;
}

export function waffoClient() {
  const merchantId = process.env.WAFFO_MERCHANT_ID;
  const privateKey = process.env.WAFFO_PRIVATE_KEY?.replaceAll("\\n", "\n");
  if (!merchantId || !privateKey) return null;
  return new WaffoPancake({ merchantId, privateKey });
}
