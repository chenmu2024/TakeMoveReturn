import assert from "node:assert/strict";
import test from "node:test";
import { csvCell, csvDocument } from "../src/lib/reports/csv.ts";

test("CSV quotes commas, quotes and line breaks", () => {
  assert.equal(csvCell('Tool, "A"\nnew'), '"Tool, ""A""\nnew"');
  assert.equal(csvCell(null), '""');
});

test("CSV neutralizes spreadsheet formulas", () => {
  for (const value of ["=1+1", "+SUM(A1)", "-2+3", "@cmd", " \t=HYPERLINK(x)"]) {
    assert.equal(csvCell(value), `"'${value}"`);
  }
  assert.equal(csvDocument(["name"], [["=1+1"]]), '\uFEFF"name"\r\n"\'=1+1"\r\n');
});
