import { assertEquals, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { buildSystemPrompt, truncateMemo } from "./systemPrompt.ts";

Deno.test("truncateMemo - <= 50 codepoints returns as-is", () => {
  assertEquals(truncateMemo("짧은 메모"), "짧은 메모");
  assertEquals(truncateMemo(""), "");
});

Deno.test("truncateMemo - > 50 codepoints adds ellipsis", () => {
  const long = "가".repeat(60);
  const out = truncateMemo(long);
  assertEquals([...out].length, 51); // 50 + ellipsis
  assertEquals(out.endsWith("…"), true);
});

Deno.test("truncateMemo - emoji boundary safe", () => {
  // 🇰🇷 is 2 codepoints. 25 of them = 50 codepoints, fits exactly.
  const emoji = "🇰🇷".repeat(25);
  assertEquals(truncateMemo(emoji), emoji);
});

Deno.test("buildSystemPrompt - empty trips → has-no-trips line", () => {
  const out = buildSystemPrompt({
    lang: "ko",
    authProvider: "google",
    tier: "free",
    stats: [],
    trips: [],
  });
  assertStringIncludes(out, "USER has no trips yet.");
});

Deno.test("buildSystemPrompt - includes profile, stats and trips sections", () => {
  const out = buildSystemPrompt({
    lang: "en",
    authProvider: "apple",
    tier: "premium",
    stats: [
      { code: "JP", visits: 2, first_visit: "2023-04-01", last_visit: "2024-08-12", total_days: 13 },
    ],
    trips: [
      {
        country_code: "JP",
        start_date: "2024-08-12",
        end_date: "2024-08-19",
        body: "오사카 다코야키 투어 — 첫째 날부터 비가 와서 정말 힘들었지만 결국 맛집은 다 갔다",
      },
      { country_code: "JP", start_date: "2023-04-01", end_date: "2023-04-05", body: null },
    ],
  });
  assertStringIncludes(out, "auth provider: apple");
  assertStringIncludes(out, "account tier: premium");
  assertStringIncludes(out, "app language: en");
  assertStringIncludes(out, "JP");
  assertStringIncludes(out, "2024-08-12 ~ 2024-08-19");
  assertStringIncludes(out, "…");
  // null body는 따옴표 블록 자체가 없어야
  const apr1Line = out.split("\n").find((l) => l.includes("2023-04-01"));
  assertEquals(apr1Line?.includes('"'), false);
});

Deno.test("buildSystemPrompt - friend tone instructions present", () => {
  const out = buildSystemPrompt({
    lang: "ko",
    authProvider: "google",
    tier: "free",
    stats: [],
    trips: [],
  });
  assertStringIncludes(out, "close friend");
  assertStringIncludes(out, "casual");
});
