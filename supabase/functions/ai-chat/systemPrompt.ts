import type { CountryStat, TripRow } from "./tripStats.ts";

export type Gender = "male" | "female" | "other" | "prefer_not_to_say" | null;

export type SystemPromptInput = {
  lang: string;
  age: number | null;
  gender: Gender;
  homeCountry: string | null; // ISO 3166-1 alpha-2 (e.g. "KR"). null이면 줄 생략.
  stats: CountryStat[]; // already top-30 sorted
  trips: TripRow[];     // already start_date desc, capped to 200 by caller
};

const MEMO_MAX_CODEPOINTS = 50;

export function truncateMemo(memo: string): string {
  const arr = Array.from(memo);
  if (arr.length <= MEMO_MAX_CODEPOINTS) return memo;
  return arr.slice(0, MEMO_MAX_CODEPOINTS).join("") + "…";
}

function statsTable(stats: CountryStat[]): string {
  if (stats.length === 0) return "(no country stats yet)";
  const header =
    "| code | visits | first_visit | last_visit | total_days |\n" +
    "|------|--------|-------------|------------|------------|";
  const rows = stats.map(
    (s) =>
      `| ${s.code} | ${s.visits} | ${s.first_visit} | ${s.last_visit} | ${s.total_days} |`
  );
  return [header, ...rows].join("\n");
}

function tripsList(trips: TripRow[]): string {
  if (trips.length === 0) return "USER has no trips yet.";
  return trips
    .map((t) => {
      const memo = (t.body ?? "").trim();
      if (!memo) return `- ${t.start_date} ~ ${t.end_date}  ${t.country_code}`;
      return `- ${t.start_date} ~ ${t.end_date}  ${t.country_code}  "${truncateMemo(memo)}"`;
    })
    .join("\n");
}

function profileLines(input: SystemPromptInput): string[] {
  const lines: string[] = [`- app language: ${input.lang}`];
  if (input.age != null) lines.push(`- age: ${input.age}`);
  if (input.gender && input.gender !== "prefer_not_to_say") {
    lines.push(`- gender: ${input.gender}`);
  }
  if (input.homeCountry) {
    lines.push(`- home country: ${input.homeCountry} (ISO 3166-1 alpha-2)`);
  }
  return lines;
}

export function buildSystemPrompt(input: SystemPromptInput): string {
  return [
    "You are VisitGrid's personal travel companion for this user.",
    `Reply in the user's app language: ${input.lang}.`,
    "Talk to the user like a close friend (casual, warm, second-person).",
    "Match the casual register of their app language.",
    "Always ground every answer in the user's profile and travel history below.",
    "Your goal is to be genuinely helpful to this specific traveler — take it seriously.",
    "Use the web_search tool ONLY when the question depends on time-sensitive,",
    "real-world facts (current safety/geopolitics, visa rules, weather windows,",
    "prices). Do NOT search for general advice the user already implies.",
    "When you reference a place that benefits from a photo or map image, you",
    "MAY include up to 4 https image URLs in your reply as markdown",
    "(`![alt](https://...)`). The client renders them inline.",
    "",
    "USER PROFILE",
    ...profileLines(input),
    "",
    "USER COUNTRY STATS  (top 30 by visit count)",
    statsTable(input.stats),
    "",
    "TRIPS  (all, up to 200, newest first; memo truncated to 50 chars)",
    tripsList(input.trips),
  ].join("\n");
}
