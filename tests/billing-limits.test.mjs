import assert from "node:assert/strict";
import test from "node:test";
import { canCreateTool, canUploadFile, getLimitStatus } from "../src/lib/billing/limits.ts";

const zeroUsage = { activeTools: 0, admins: 0, storageBytes: 0 };

test("tool limits enforce the exact Free/Starter/Growth/Pro boundaries", () => {
  const cases = [
    ["free", 24, true],
    ["free", 25, false],
    ["starter", 199, true],
    ["starter", 200, false],
    ["starter", 201, false],
    ["growth", 599, true],
    ["growth", 600, false],
    ["growth", 601, false],
    ["pro", 1999, true],
    ["pro", 2000, false],
    ["pro", 2001, false],
  ];
  for (const [plan, activeTools, expected] of cases) {
    assert.equal(canCreateTool(plan, { ...zeroUsage, activeTools }), expected, `${plan} at ${activeTools}`);
  }
});

test("admin over-limit is reported without blocking existing account state", () => {
  const starterAtLimit = getLimitStatus("starter", { activeTools: 10, admins: 2, storageBytes: 0 });
  assert.equal(starterAtLimit.admins, true);
  assert.equal(starterAtLimit.overLimit, false);

  const downgraded = getLimitStatus("starter", { activeTools: 10, admins: 5, storageBytes: 0 });
  assert.equal(downgraded.admins, true);
  assert.equal(downgraded.overLimit, true);
});

test("storage uploads allow the final byte but reject any byte over plan capacity", () => {
  const oneMb = 1024 * 1024;
  const freeLimit = 100 * oneMb;
  assert.equal(canUploadFile("free", { ...zeroUsage, storageBytes: freeLimit - 1 }, 1), true);
  assert.equal(canUploadFile("free", { ...zeroUsage, storageBytes: freeLimit }, 1), false);
  assert.equal(canUploadFile("free", zeroUsage, 0), false);
});

test("tool capacity and storage restrictions do not redefine over-limit semantics", () => {
  const status = getLimitStatus("growth", {
    activeTools: 600,
    admins: 5,
    storageBytes: 10 * 1024 * 1024 * 1024,
  });
  assert.deepEqual(status, { tools: true, admins: true, storage: true, overLimit: false });

  const over = getLimitStatus("growth", {
    activeTools: 601,
    admins: 6,
    storageBytes: 10 * 1024 * 1024 * 1024 + 1,
  });
  assert.equal(over.overLimit, true);
});
