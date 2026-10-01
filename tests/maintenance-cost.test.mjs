import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("maintenance browser validation accepts decimal costs and rejects malformed input", () => {
  const page = readFileSync(new URL("../src/app/app/maintenance/page.tsx", import.meta.url), "utf8");
  const pattern = page.match(/name="cost"[^>]*pattern="([^"]+)"/)?.[1];
  assert.ok(pattern, "The cost input must declare its validation pattern");
  const validation = new RegExp(`^(?:${pattern})$`, "v");
  for (const value of ["0", "0.00", "12.50", "99999.9"]) assert.equal(validation.test(value), true, value);
  for (const value of ["", "-1", "1.234", "1,50", "10000000", "NaN"]) assert.equal(validation.test(value), false, value);
});
