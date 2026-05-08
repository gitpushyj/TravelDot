// 자동 탐지가 (country, date) 신호를 가져왔을 때 어떤 동작을 할지 결정하는 순수 함수.
// SQL/DB 의존성 없이 입력만 받아 plan을 산출하므로 jest로 단위 테스트 가능하다.
// 실제 DB 적용은 tripIngest.ts가 이 plan을 받아 트랜잭션 안에서 수행.

export type ExistingTripView = {
  id: string;
  startDate: string;
  endDate: string;
};

export type IngestPlan =
  | { kind: "noop"; tripId: string }
  | { kind: "extend"; tripId: string; newStart: string; newEnd: string }
  | {
      kind: "merge";
      keepId: string;
      absorbId: string;
      newStart: string;
      newEnd: string;
    }
  | { kind: "create"; date: string };

// 우선순위:
// 1) date를 이미 포함하는 트립이 있으면 noop.
// 2) 인접 트립 양쪽이 다 있으면 두 트립 병합 (left 유지, right 흡수).
// 3) 한쪽만 있으면 그쪽 트립 확장.
// 4) 없으면 단일일 트립 신규 생성.
export function planIngestVisitDay(input: {
  date: string;
  containing: ExistingTripView | null;
  left: ExistingTripView | null; // endDate + 1 == date
  right: ExistingTripView | null; // startDate - 1 == date
}): IngestPlan {
  const { date, containing, left, right } = input;

  if (containing) {
    return { kind: "noop", tripId: containing.id };
  }

  if (left && right) {
    return {
      kind: "merge",
      keepId: left.id,
      absorbId: right.id,
      newStart: left.startDate,
      newEnd: right.endDate,
    };
  }

  if (left) {
    return {
      kind: "extend",
      tripId: left.id,
      newStart: left.startDate,
      newEnd: date,
    };
  }

  if (right) {
    return {
      kind: "extend",
      tripId: right.id,
      newStart: date,
      newEnd: right.endDate,
    };
  }

  return { kind: "create", date };
}
