import test from "node:test";
import assert from "node:assert/strict";
import { dayRange, today, validDay, timeLabel } from "../src/lib/time";

test("Dominican date changes at 04:00 UTC, not at UTC midnight", () => {
  assert.equal(today(new Date("2026-10-20T03:59:59Z")), "2026-10-19");
  assert.equal(today(new Date("2026-10-20T04:00:00Z")), "2026-10-20");
});
test("day boundaries exclude midnight of the following day", () => {
  const range = dayRange("2026-10-20");
  assert.equal(range.gte.toISOString(), "2026-10-20T04:00:00.000Z");
  assert.equal(range.lt.toISOString(), "2026-10-21T04:00:00.000Z");
});
test("invalid calendar dates and malformed input are rejected", () => {
  for (const value of [
    "2026-02-29",
    "2026-13-01",
    "2026-04-31",
    "20/10/2026",
    "' OR 1=1",
  ]) {
    assert.equal(validDay(value), false);
  }
  assert.equal(validDay("2028-02-29"), true);
});
test("hours are formatted in Dominican local time", () => {
  assert.equal(timeLabel("2026-10-20T14:30:00Z"), "10:30");
});
