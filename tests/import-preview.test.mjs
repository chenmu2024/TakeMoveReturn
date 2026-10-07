import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { parseCsv, reviewImport, suggestedMapping } from "../src/lib/import/preview.ts";

test("public fictional CSV works with the real import preview", () => {
  const rows = parseCsv(readFileSync(new URL("../public/resources/tool-register-example.csv", import.meta.url), "utf8"));
  const mapping = suggestedMapping(rows[0]);
  assert.ok(Object.values(mapping).every((column) => column >= 0));
  const result = reviewImport(rows, mapping);
  assert.equal(result.total, 6);
  assert.equal(result.valid, result.total);
  assert.deepEqual(result.issues, []);
  assert.equal(new Set(result.normalizedRows.map((row) => row.assetCode)).size, result.total);
});

test("CSV handles BOM, quoted commas, embedded newlines and doubled quotes", () => {
  assert.deepEqual(parseCsv('\uFEFFAsset Code,Tool Name\r\nA1,"Drill, 18V"\r\nA2,"Saw ""compact""\nkit"\r\n'), [
    ["Asset Code", "Tool Name"], ["A1", "Drill, 18V"], ["A2", 'Saw "compact"\nkit'],
  ]);
  assert.throws(() => parseCsv('Code,Name\nA1,"unfinished'), /unfinished/);
  assert.throws(() => parseCsv('Code,Name\nA1,"okay"bad'), /malformed/);
});

test("import review maps headers, validates rows and preserves source line numbers", () => {
  const rows = parseCsv("Asset Code,Tool Name,Category,Brand,Model,Serial Number\nA1,Drill,Power,Milwaukee,2904-20,SN1\n\nA1,Saw,Power,,,\nB2,X,Other,,,\n");
  const mapping = suggestedMapping(rows[0]);
  assert.deepEqual(mapping, { assetCode: 0, name: 1, category: 2, brand: 3, model: 4, serialNumber: 5 });
  const result = reviewImport(rows, mapping);
  assert.equal(result.total, 3);
  assert.equal(result.valid, 1);
  assert.deepEqual(result.normalizedRows[0], {
    assetCode: "A1", name: "Drill", category: "Power",
    brand: "Milwaukee", model: "2904-20", serialNumber: "SN1",
  });
  assert.deepEqual(result.issues.map((issue) => issue.row), [4, 5]);
  assert.match(result.issues[0].reason, /Duplicate/);
  assert.match(result.issues[1].reason, /Tool name/);
  assert.throws(() => reviewImport(rows, {
    assetCode: 0, name: 0, category: -1, brand: -1, model: -1, serialNumber: -1,
  }), /different source column/);
});

test("CSV stops beyond the 5,000-row hard limit", () => {
  const data = ["Code,Name", ...Array.from({ length: 5_001 }, (_, index) => `A${index},Tool ${index}`)].join("\n");
  assert.throws(() => parseCsv(data), /5,000/);
});


test("optional metadata lengths are validated", () => {
  const rows = [["Asset Code", "Tool Name", "Brand"], ["A1", "Drill", "B".repeat(81)]];
  const result = reviewImport(rows, {
    assetCode: 0, name: 1, category: -1, brand: 2, model: -1, serialNumber: -1,
  });
  assert.equal(result.valid, 0);
  assert.match(result.issues[0].reason, /Brand/);
});
