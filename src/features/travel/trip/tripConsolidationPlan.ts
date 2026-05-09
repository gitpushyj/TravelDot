// 같은 country의 active 트립들을 입력받아 어떤 트립이 어떤 트립에 흡수돼야 하는지를
// 결정하는 순수 함수. SQL/DB 의존성이 없어 jest로 단위 테스트 가능하다.
// 실제 DB 적용은 tripMerge.ts의 wrapper가 이 plan을 받아 트랜잭션 안에서 수행.
//
// 두 가지 호출 경로를 한 함수로 다룬다:
//   - 첫 스캔 직후: 인접(gap 1..N) 자동 병합. includeOverlap=false.
//   - cross-device pull 직후: overlap(gap ≤ 0)만 정리. adjacentThresholdDays=0,
//     includeOverlap=true. 사용자가 한쪽 기기에서 의도적으로 분리해둔 인접 트립을
//     자동으로 다시 합치지 않기 위해 인접 병합은 끈다.
//
// 입력 rows는 (country_code, start_date) ASC로 정렬돼 있다고 가정한다.

import { diffInDays } from "../visit/dateUtils";

export type ConsolidationRow = {
  id: string;
  country_code: string;
  start_date: string;
  end_date: string;
};

export type ConsolidationOp = {
  keepId: string;
  newEnd: string;
  absorbIds: string[];
};

export type PlanOptions = {
  // 1..N 일의 gap을 자동으로 다리 놓아 합칠 임계값. 0이면 인접 병합 비활성.
  adjacentThresholdDays: number;
  // true면 gap ≤ 0(겹치거나 한쪽이 다른쪽을 포함)인 트립도 흡수.
  includeOverlap: boolean;
};

export function planConsolidations(
  rows: ConsolidationRow[],
  opts: PlanOptions
): ConsolidationOp[] {
  const ops: ConsolidationOp[] = [];

  let curCountry: string | null = null;
  let cur: ConsolidationOp | null = null;
  let curEnd = "";

  const flush = () => {
    if (cur && cur.absorbIds.length > 0) ops.push(cur);
    cur = null;
  };

  for (const r of rows) {
    if (r.country_code !== curCountry) {
      flush();
      curCountry = r.country_code;
      cur = { keepId: r.id, newEnd: r.end_date, absorbIds: [] };
      curEnd = r.end_date;
      continue;
    }
    const gap = diffInDays(curEnd, r.start_date);
    const isAdjacent = gap >= 1 && gap <= opts.adjacentThresholdDays;
    const isOverlap = gap <= 0 && opts.includeOverlap;
    if (isAdjacent || isOverlap) {
      cur!.absorbIds.push(r.id);
      if (r.end_date > cur!.newEnd) cur!.newEnd = r.end_date;
      if (r.end_date > curEnd) curEnd = r.end_date;
    } else {
      flush();
      cur = { keepId: r.id, newEnd: r.end_date, absorbIds: [] };
      curEnd = r.end_date;
    }
  }
  flush();
  return ops;
}
