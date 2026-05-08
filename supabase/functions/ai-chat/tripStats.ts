// trips 행 → AI system prompt에 넣을 통계로 변환하는 순수 함수.
// 외부 의존 없음. 테스트는 Deno test로.

export type TripRow = {
  country_code: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  body: string | null;
};

export type CountryStat = {
  code: string;
  visits: number;
  first_visit: string;
  last_visit: string;
  total_days: number;
};

const MS_PER_DAY = 86_400_000;

function inclusiveDays(start: string, end: string): number {
  const s = Date.parse(start + "T00:00:00Z");
  const e = Date.parse(end + "T00:00:00Z");
  if (Number.isNaN(s) || Number.isNaN(e)) return 0;
  return Math.max(1, Math.round((e - s) / MS_PER_DAY) + 1);
}

export function aggregateCountryStats(rows: TripRow[]): CountryStat[] {
  const acc = new Map<string, CountryStat>();
  for (const r of rows) {
    const cur = acc.get(r.country_code);
    const days = inclusiveDays(r.start_date, r.end_date);
    if (!cur) {
      acc.set(r.country_code, {
        code: r.country_code,
        visits: 1,
        first_visit: r.start_date,
        last_visit: r.start_date,
        total_days: days,
      });
    } else {
      cur.visits += 1;
      if (r.start_date < cur.first_visit) cur.first_visit = r.start_date;
      if (r.start_date > cur.last_visit) cur.last_visit = r.start_date;
      cur.total_days += days;
    }
  }
  // 방문 횟수 desc, 동률이면 코드 asc
  const sorted = Array.from(acc.values()).sort((a, b) =>
    b.visits - a.visits || (a.code < b.code ? -1 : a.code > b.code ? 1 : 0)
  );
  return sorted.slice(0, 30);
}

export function sortTripsForPrompt(rows: TripRow[]): TripRow[] {
  return [...rows].sort((a, b) =>
    a.start_date < b.start_date ? 1 : a.start_date > b.start_date ? -1 : 0
  );
}
