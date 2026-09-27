import assert from "node:assert/strict";
import { test } from "node:test";
import { parseCsv, reviewImport, suggestedMapping } from "../src/lib/import/preview.ts";

test("CSV handles BOM, quoted commas, embedded newlines and doubled quotes", () => {
  assert.deepEqual(parseCsv('\uFEFFAsset Code,Tool Name\r\nA1,"Drill, 18V"\r\nA2,"Saw ""compact""\nkit"\r\n'), [
    ["Asset Code", "Tool Name"], ["A1", "Drill, 18V"], ["A2", 'Saw "compact"\nkit'],
  ]);
  assert.throws(() => parseCsv('Code,Name\nA1,"unfinished'), /unfinished/);
  assert.throws(() => parseCsv('Code,Name\nA1,"okay"bad'), /malformed/);
});

test("import review maps headers, validates rows and preserves source line numbers", () => {
  const rows = parseCsv("Asset Code,Tool Name,Category\nA1,Drill,Power\n\nA1,Saw,Power\nB2,X,Other\n");
  const mapping = suggestedMapping(rows[0]);
  assert.deepEqual(mapping, { assetCode: 0, name: 1, category: 2 });
  const result = reviewImport(rows, mapping);
  assert.equal(result.total, 3);
  assert.equal(result.valid, 1);
  assert.deepEqual(result.issues.map((issue) => issue.row), [4, 5]);
  assert.match(result.issues[0].reason, /Duplicate/);
  assert.match(result.issues[1].reason, /Tool name/);
  assert.throws(() => reviewImport(rows, { assetCode: 0, name: 0, category: -1 }), /different columns/);
});

test("CSV stops beyond the 5,000-row hard limit", () => {
  const data = ["Code,Name", ...Array.from({ length: 5_001 }, (_, index) => `A${index},Tool ${index}`)].join("\n");
  assert.throws(() => parseCsv(data), /5,000/);
});
