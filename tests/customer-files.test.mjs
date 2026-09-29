import assert from "node:assert/strict";
import test from "node:test";
import { validateCustomerFile } from "../src/lib/files/customer-files.ts";

test("customer file validation accepts intended file kinds and types", () => {
  assert.equal(validateCustomerFile({ kind: "tool_photo", name: "drill.webp", type: "image/webp", size: 1024 }).ok, true);
  assert.equal(validateCustomerFile({ kind: "damage_photo", name: "damage.jpg", type: "image/jpeg", size: 2048 }).ok, true);
  assert.equal(validateCustomerFile({ kind: "maintenance_attachment", name: "service.pdf", type: "application/pdf", size: 4096 }).ok, true);
});

test("customer file validation rejects unsafe names, types and sizes", () => {
  assert.equal(validateCustomerFile({ kind: "tool_photo", name: "../tool.jpg", type: "image/jpeg", size: 100 }).ok, false);
  assert.equal(validateCustomerFile({ kind: "tool_photo", name: "tool.pdf", type: "application/pdf", size: 100 }).ok, false);
  assert.equal(validateCustomerFile({ kind: "maintenance_attachment", name: "service.exe", type: "application/octet-stream", size: 100 }).ok, false);
  assert.equal(validateCustomerFile({ kind: "damage_photo", name: "damage.png", type: "image/png", size: 0 }).ok, false);
  assert.equal(validateCustomerFile({ kind: "damage_photo", name: "damage.png", type: "image/png", size: 10 * 1024 * 1024 + 1 }).ok, false);
});
