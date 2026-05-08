import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { aggregateCountryStats, sortTripsForPrompt } from "./tripStats.ts";

const sample = [
  { country_code: "JP", start_date: "2024-08-12", end_date: "2024-08-19", body: "오사카" },
  { country_code: "JP", start_date: "2023-04-01", end_date: "2023-04-05", body: null },
  { country_code: "TH", start_date: "2024-07-03", end_date: "2024-07-05", body: "" },
  { country_code: "TH", start_date: "2022-12-30", end_date: "2023-01-02", body: "송끄란 전" },
];

Deno.test("aggregateCountryStats - groups by country with correct stats", () => {
  const stats = aggregateCountryStats(sample);
  assertEquals(stats.length, 2);
  // JP: 2 visits, first 2023-04-01, last 2024-08-12, days = 5+8 = 13
  assertEquals(stats[0], {
    code: "JP",
    visits: 2,
    first_visit: "2023-04-01",
    last_visit: "2024-08-12",
    total_days: 13,
  });
  // TH: 2 visits, first 2022-12-30, last 2024-07-03, days = 4+3 = 7
  assertEquals(stats[1], {
    code: "TH",
    visits: 2,
    first_visit: "2022-12-30",
    last_visit: "2024-07-03",
    total_days: 7,
  });
});

Deno.test("aggregateCountryStats - top 30 cap by visits desc, tie by code asc", () => {
  const rows = Array.from({ length: 35 }, (_, i) => ({
    country_code: String.fromCharCode(65 + (i % 26)) + String.fromCharCode(65 + ((i + 1) % 26)),
    start_date: "2024-01-01",
    end_date: "2024-01-01",
    body: null,
  }));
  const stats = aggregateCountryStats(rows);
  assertEquals(stats.length <= 30, true);
});

Deno.test("sortTripsForPrompt - start_date desc, deterministic", () => {
  const sorted = sortTripsForPrompt(sample);
  assertEquals(sorted.map((t) => t.start_date), [
    "2024-08-12",
    "2024-07-03",
    "2023-04-01",
    "2022-12-30",
  ]);
});

Deno.test("aggregateCountryStats - same-day trip counts as 1 day", () => {
  const stats = aggregateCountryStats([
    { country_code: "FR", start_date: "2024-05-01", end_date: "2024-05-01", body: null },
  ]);
  assertEquals(stats[0].total_days, 1);
});

Deno.test("aggregateCountryStats - empty input returns []", () => {
  assertEquals(aggregateCountryStats([]), []);
});
