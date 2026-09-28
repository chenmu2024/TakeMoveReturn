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
  assert.equal(siteConfig.legal.operatorType, "individual");
  assert.equal(siteConfig.legal.registeredBusinessName, null);
  assert.equal(siteConfig.legal.registrationNumber, null);
  assert.equal(siteConfig.legal.registeredAddress, null);
  assert.equal(siteConfig.privacyEmail, "contact@takemovereturn.com");
});

test("retention targets are explicit", () => {
  assert.equal(retention.operationalLogsDays, 90);
  assert.equal(retention.securityLogsDays, 180);
  assert.equal(retention.temporaryImportsHours, 24);
  assert.equal(retention.deletedAccountActiveDataTargetDays, 30);
});

test("Waffo product IDs match the six approved production products", () => {
  assert.deepEqual([
    waffoProductId("starter", "month"), waffoProductId("starter", "year"),
    waffoProductId("growth", "month"), waffoProductId("growth", "year"),
    waffoProductId("pro", "month"), waffoProductId("pro", "year"),
  ], [
    "PROD_6r7BgQwdISjVP4rSXOSKM2", "PROD_6q1uR35uOFyVYKDg4ypBfn",
    "PROD_4nt9dFLFaZPJleMoIB7Noi", "PROD_3TsrSqcc4LaDFNgUj2xPLG",
    "PROD_47MCf9ZEwTRsubJ4BKepj1", "PROD_52Zme9Q6c2FruTBXOxtsNq",
  ]);
});
