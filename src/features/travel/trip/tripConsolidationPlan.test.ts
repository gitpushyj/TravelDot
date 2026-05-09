import {
  planConsolidations,
  type ConsolidationRow,
} from "./tripConsolidationPlan";

const row = (
  id: string,
  country: string,
  start: string,
  end: string
): ConsolidationRow => ({
  id,
  country_code: country,
  start_date: start,
  end_date: end,
});

describe("planConsolidations - adjacent only (post-scan)", () => {
  const opts = { adjacentThresholdDays: 3, includeOverlap: false };

  it("gap ≤ threshold 인접 트립을 하나로 묶음", () => {
    const ops = planConsolidations(
      [
        row("a", "JP", "2024-05-01", "2024-05-03"),
        row("b", "JP", "2024-05-05", "2024-05-06"), // gap=2
      ],
      opts
    );
    expect(ops).toEqual([
      { keepId: "a", newEnd: "2024-05-06", absorbIds: ["b"] },
    ]);
  });

  it("gap > threshold면 분리", () => {
    const ops = planConsolidations(
      [
        row("a", "JP", "2024-05-01", "2024-05-03"),
        row("b", "JP", "2024-05-08", "2024-05-09"), // gap=5
      ],
      opts
    );
    expect(ops).toEqual([]);
  });

  it("country가 바뀌면 그룹 분리", () => {
    const ops = planConsolidations(
      [
        row("a", "JP", "2024-05-01", "2024-05-01"),
        row("b", "KR", "2024-05-02", "2024-05-02"),
      ],
      opts
    );
    expect(ops).toEqual([]);
  });

  it("연속 chain merge", () => {
    const ops = planConsolidations(
      [
        row("a", "JP", "2024-05-01", "2024-05-01"),
        row("b", "JP", "2024-05-03", "2024-05-03"), // gap=2
        row("c", "JP", "2024-05-05", "2024-05-05"), // gap=2
      ],
      opts
    );
    expect(ops).toEqual([
      { keepId: "a", newEnd: "2024-05-05", absorbIds: ["b", "c"] },
    ]);
  });

  it("overlap은 무시 (인접 모드)", () => {
    const ops = planConsolidations(
      [
        row("a", "JP", "2018-01-07", "2018-02-07"),
        row("b", "JP", "2018-01-10", "2018-01-10"), // 안에 들어있음 → gap=-28
      ],
      opts
    );
    expect(ops).toEqual([]);
  });
});

describe("planConsolidations - overlap only (post-pull)", () => {
  const opts = { adjacentThresholdDays: 0, includeOverlap: true };

  it("긴 트립 안에 든 짧은 트립을 흡수 (사용자 시나리오)", () => {
    // Device A가 병합한 큰 트립 + Device B의 개별 트립이 한 디바이스에 모인 상태
    const ops = planConsolidations(
      [
        row("aaaa", "CN", "2018-01-07", "2018-02-07"),
        row("bbbb", "CN", "2018-01-10", "2018-01-10"),
        row("cccc", "CN", "2018-01-13", "2018-01-13"),
      ],
      opts
    );
    expect(ops).toEqual([
      { keepId: "aaaa", newEnd: "2018-02-07", absorbIds: ["bbbb", "cccc"] },
    ]);
  });

  it("부분 overlap도 흡수, end_date는 max로 확장", () => {
    const ops = planConsolidations(
      [
        row("a", "JP", "2024-05-01", "2024-05-05"),
        row("b", "JP", "2024-05-03", "2024-05-10"), // overlap
      ],
      opts
    );
    expect(ops).toEqual([
      { keepId: "a", newEnd: "2024-05-10", absorbIds: ["b"] },
    ]);
  });

  it("touching(gap=0)도 흡수", () => {
    const ops = planConsolidations(
      [
        row("a", "JP", "2024-05-01", "2024-05-05"),
        row("b", "JP", "2024-05-05", "2024-05-07"), // 같은 날 시작
      ],
      opts
    );
    expect(ops).toEqual([
      { keepId: "a", newEnd: "2024-05-07", absorbIds: ["b"] },
    ]);
  });

  it("인접(gap=1)은 흡수하지 않음 (사용자 분리 의도 보존)", () => {
    const ops = planConsolidations(
      [
        row("a", "JP", "2024-05-01", "2024-05-03"),
        row("b", "JP", "2024-05-04", "2024-05-05"), // gap=1
      ],
      opts
    );
    expect(ops).toEqual([]);
  });

  it("country가 다르면 같은 날짜라도 합치지 않음", () => {
    const ops = planConsolidations(
      [
        row("a", "JP", "2024-05-01", "2024-05-10"),
        row("b", "KR", "2024-05-05", "2024-05-05"),
      ],
      opts
    );
    expect(ops).toEqual([]);
  });

  it("keep 트립의 end_date 확장 후 그 다음 트립과의 비교에 반영", () => {
    // a가 b를 흡수하면서 end가 5-15로 늘어남.
    // 그 후 c(5-12 시작)는 새로운 a 범위 안 → 흡수돼야 함.
    const ops = planConsolidations(
      [
        row("a", "JP", "2024-05-01", "2024-05-05"),
        row("b", "JP", "2024-05-03", "2024-05-15"),
        row("c", "JP", "2024-05-12", "2024-05-13"),
      ],
      opts
    );
    expect(ops).toEqual([
      { keepId: "a", newEnd: "2024-05-15", absorbIds: ["b", "c"] },
    ]);
  });
});

describe("planConsolidations - 빈 입력", () => {
  it("빈 배열은 빈 ops", () => {
    expect(
      planConsolidations([], {
        adjacentThresholdDays: 3,
        includeOverlap: true,
      })
    ).toEqual([]);
  });

  it("싱글 트립이면 흡수 대상 없음", () => {
    expect(
      planConsolidations([row("a", "JP", "2024-05-01", "2024-05-05")], {
        adjacentThresholdDays: 3,
        includeOverlap: true,
      })
    ).toEqual([]);
  });
});
