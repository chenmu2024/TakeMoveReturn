import assert from "node:assert/strict";
import test from "node:test";
import { dateInTimeZone, endOfLocalDateUtc, localDueDateFromBoundary } from "../src/lib/timezone.ts";

test("expected return boundaries respect company timezones", () => {
  assert.equal(endOfLocalDateUtc("2026-10-01", "America/New_York"), "2026-10-02T04:00:00.000Z");
  assert.equal(endOfLocalDateUtc("2026-10-01", "America/Los_Angeles"), "2026-10-02T07:00:00.000Z");
});

test("expected return boundaries handle daylight saving transitions", () => {
  assert.equal(endOfLocalDateUtc("2026-03-08", "America/Los_Angeles"), "2026-03-09T07:00:00.000Z");
  assert.equal(endOfLocalDateUtc("2026-11-01", "America/Los_Angeles"), "2026-11-02T08:00:00.000Z");
});

test("expected return boundaries round-trip to local due date", () => {
  const boundary = endOfLocalDateUtc("2026-10-01", "America/New_York");
  assert.equal(localDueDateFromBoundary(boundary, "America/New_York"), "2026-10-01");
  assert.equal(endOfLocalDateUtc("not-a-date", "America/New_York"), null);
  assert.equal(endOfLocalDateUtc("2026-02-31", "America/New_York"), null);
  assert.equal(endOfLocalDateUtc("2026-10-01", "Not/AZone"), null);
});


test("calendar dates are derived in the workspace timezone", () => {
  assert.equal(dateInTimeZone("2026-10-02T02:00:00Z", "America/New_York"), "2026-10-01");
  assert.equal(dateInTimeZone("2026-10-02T08:00:00Z", "America/Los_Angeles"), "2026-10-02");
  assert.equal(dateInTimeZone("bad", "America/New_York"), null);
});
