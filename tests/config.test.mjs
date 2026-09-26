import assert from "node:assert/strict";
import test from "node:test";
import { plans } from "../src/config/plans.ts";
import { retention } from "../src/config/retention.ts";
import { siteConfig } from "../src/config/site.ts";
import { waffoProductId } from "../src/lib/billing/waffo.ts";

test("published prices and annual billing stay aligned", () => {
  for (const plan of [plans.starter, plans.growth, plans.pro]) {
    assert.equal(plan.annualPrice, plan.monthlyPrice * 10);
    assert.equal(plan.fieldWorkerLimit, "unlimited");
  }
});

test("individual operator is not represented as a company", () => {
  assert.equal(siteConfig.legal.legalOperatorName, "Qiaosheng Zhong");
  assert.equal(siteConfig.legal.registeredCompany, false);
  assert.equal(siteConfig.legal.registeredSoleProprietor, false);
  assert.equal(siteConfig.privacyEmail, "privacy@takemovereturn.com");
});

test("retention targets are explicit", () => {
  assert.equal(retention.operationalLogsDays, 90);
  assert.equal(retention.securityLogsDays, 180);
  assert.equal(retention.temporaryImportsHours, 24);
  assert.equal(retention.deletedAccountActiveDataTargetDays, 30);
});

test("Waffo product is selected only from server configuration", () => {
  const previous = process.env.WAFFO_PRODUCT_STARTER_MONTHLY;
  process.env.WAFFO_PRODUCT_STARTER_MONTHLY = "test-starter-month";
  try {
    assert.equal(waffoProductId("starter", "month"), "test-starter-month");
    assert.equal(waffoProductId("starter", "year"), null);
  } finally {
    if (previous === undefined) delete process.env.WAFFO_PRODUCT_STARTER_MONTHLY;
    else process.env.WAFFO_PRODUCT_STARTER_MONTHLY = previous;
  }
});
