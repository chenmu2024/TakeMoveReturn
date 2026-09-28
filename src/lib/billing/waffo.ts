import { WaffoPancake } from "@waffo/pancake-ts";
import type { BillingInterval, PlanId } from "../../config/plans";

export function waffoProductId(plan: Exclude<PlanId, "free">, interval: BillingInterval) {
  const products = {
    starter: { month: "PROD_6r7BgQwdISjVP4rSXOSKM2", year: "PROD_6q1uR35uOFyVYKDg4ypBfn" },
    growth: { month: "PROD_4nt9dFLFaZPJleMoIB7Noi", year: "PROD_3TsrSqcc4LaDFNgUj2xPLG" },
    pro: { month: "PROD_47MCf9ZEwTRsubJ4BKepj1", year: "PROD_52Zme9Q6c2FruTBXOxtsNq" },
  } as const;
  return products[plan][interval];
}

export function waffoClient() {
  const merchantId = process.env.WAFFO_MERCHANT_ID;
  const rawKey = process.env.WAFFO_PRIVATE_KEY?.replaceAll("\\n", "\n").trim();
  if (!merchantId || !rawKey) return null;
  if (!rawKey.includes("-----BEGIN PRIVATE KEY-----") && !/^[A-Za-z0-9+/]+=*$/.test(rawKey)) return null;
  const privateKey = rawKey.includes("-----BEGIN PRIVATE KEY-----") ? rawKey :
    `-----BEGIN PRIVATE KEY-----\n${rawKey.match(/.{1,64}/g)!.join("\n")}\n-----END PRIVATE KEY-----`;
  return new WaffoPancake({ merchantId, privateKey });
}
