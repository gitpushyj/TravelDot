import { addOneDay, diffInDays } from "../visit/dateUtils";

// 트립 한 줄에 들어 있는 날짜 수.
export function tripDayCount(t: {
  startDate: string;
  endDate: string;
}): number {
  return diffInDays(t.startDate, t.endDate) + 1;
}

// 트립의 [start, end]를 (country, date) 페어로 펼친다.
// 카운트·달력·yearSummary 같이 일자 단위 집계가 필요할 때 사용.
// 트립 수가 적고 평균 일수가 길지 않으니 JS에서 펼쳐도 비용 무시 가능.
export function* expandTripDays(t: {
  countryCode: string;
  startDate: string;
  endDate: string;
}): Generator<{ countryCode: string; date: string }> {
  let cur = t.startDate;
  while (cur <= t.endDate) {
    yield { countryCode: t.countryCode, date: cur };
    cur = addOneDay(cur);
  }
}
