import assert from "node:assert/strict";
import test from "node:test";
import {
  billingIdempotencyKey,
  canRequestCancellation,
  canRequestPlanChange,
  canRequestReactivation,
  isBillingInterval,
  isPaidPlan,
  planChangeTiming,
} from "../src/lib/billing/lifecycle.ts";

test("billing lifecycle validates plan and interval values", () => {
  assert.equal(isPaidPlan("starter"), true);
  assert.equal(isPaidPlan("growth"), true);
  assert.equal(isPaidPlan("pro"), true);
  assert.equal(isPaidPlan("free"), false);
  assert.equal(isBillingInterval("month"), true);
  assert.equal(isBillingInterval("year"), true);
  assert.equal(isBillingInterval("annual"), false);
});

test("higher-capacity upgrades are immediate", () => {
  assert.equal(planChangeTiming("starter", "month", "growth", "month"), "immediate");
  assert.equal(planChangeTiming("growth", "year", "pro", "month"), "immediate");
});

test("downgrades and interval-only changes are next period", () => {
  assert.equal(planChangeTiming("pro", "month", "growth", "month"), "next_period");
  assert.equal(planChangeTiming("growth", "month", "growth", "year"), "next_period");
  assert.equal(planChangeTiming("growth", "year", "growth", "month"), "next_period");
});

test("unchanged plan and interval are rejected", () => {
  assert.throws(() => planChangeTiming("starter", "month", "starter", "month"), /unchanged/);
});

test("lifecycle actions are only exposed in valid states", () => {
  assert.equal(canRequestPlanChange("active"), true);
  assert.equal(canRequestPlanChange("past_due"), false);
  assert.equal(canRequestPlanChange("canceling"), false);

  assert.equal(canRequestCancellation("active"), true);
  assert.equal(canRequestCancellation("past_due"), true);
  assert.equal(canRequestCancellation("canceling"), false);
  assert.equal(canRequestCancellation("canceled"), false);

  assert.equal(canRequestReactivation("canceling"), true);
  assert.equal(canRequestReactivation("active"), false);
  assert.equal(canRequestReactivation("past_due"), false);
});

test("billing action idempotency keys are stable, bounded, and revision-specific", () => {
  const a = billingIdempotencyKey("cancel", "ORD_123456789", "2026-09-29T09:00:00.123Z");
  const b = billingIdempotencyKey("cancel", "ORD_123456789", "2026-09-29T09:00:00.123Z");
  const c = billingIdempotencyKey("reactivate", "ORD_123456789", "2026-09-29T09:05:00.123Z");
  assert.equal(a, b);
  assert.notEqual(a, c);
  assert.match(a, /^[A-Za-z0-9_-]+$/);
  assert.ok(a.length <= 256);
});
