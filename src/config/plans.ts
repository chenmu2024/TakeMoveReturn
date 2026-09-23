export type BillingInterval = "month" | "year";
export type PlanId = "free" | "starter" | "growth" | "pro";

export const plans = {
  free: {
    id: "free",
    name: "Free",
    monthlyPrice: 0,
    annualPrice: 0,
    toolLimit: 25,
    adminLimit: 1,
    fieldWorkerLimit: "unlimited",
    storageLimitBytes: 100 * 1024 * 1024,
  },
  starter: {
    id: "starter",
    name: "Starter",
    monthlyPrice: 19,
    annualPrice: 190,
    toolLimit: 200,
    adminLimit: 2,
    fieldWorkerLimit: "unlimited",
    storageLimitBytes: 2 * 1024 * 1024 * 1024,
  },
  growth: {
    id: "growth",
    name: "Growth",
    monthlyPrice: 39,
    annualPrice: 390,
    toolLimit: 600,
    adminLimit: 5,
    fieldWorkerLimit: "unlimited",
    storageLimitBytes: 10 * 1024 * 1024 * 1024,
  },
  pro: {
    id: "pro",
    name: "Pro",
    monthlyPrice: 79,
    annualPrice: 790,
    toolLimit: 2000,
    adminLimit: 10,
    fieldWorkerLimit: "unlimited",
    storageLimitBytes: 25 * 1024 * 1024 * 1024,
  },
} as const;
