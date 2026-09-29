import type { BillingInterval, PlanId } from "../../config/plans";

export type PaidPlanId = Exclude<PlanId, "free">;
export type PlanChangeTiming = "immediate" | "next_period";

const rank: Record<PaidPlanId, number> = { starter: 1, growth: 2, pro: 3 };

export function isPaidPlan(value: unknown): value is PaidPlanId {
  return value === "starter" || value === "growth" || value === "pro";
}

export function isBillingInterval(value: unknown): value is BillingInterval {
  return value === "month" || value === "year";
}

export function planChangeTiming(
  fromPlan: PaidPlanId,
  fromInterval: BillingInterval,
  toPlan: PaidPlanId,
  toInterval: BillingInterval,
): PlanChangeTiming {
  if (rank[toPlan] > rank[fromPlan]) return "immediate";
  if (rank[toPlan] < rank[fromPlan]) return "next_period";
  if (toInterval !== fromInterval) return "next_period";
  throw new Error("Target plan and billing interval are unchanged");
}

export function canRequestPlanChange(status: string | null): boolean {
  return status === "active";
}

export function canRequestCancellation(status: string | null): boolean {
  return status === "active" || status === "past_due";
}

export function canRequestReactivation(status: string | null): boolean {
  return status === "canceling";
}

export function billingIdempotencyKey(action: "cancel" | "reactivate", orderId: string, updatedAt: string): string {
  const revision = updatedAt.replace(/[^0-9]/g, "").slice(0, 20) || "0";
  return `tmr_${action}_${orderId}_${revision}`;
}
