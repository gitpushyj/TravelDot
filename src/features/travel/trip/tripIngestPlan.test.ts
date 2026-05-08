import { planIngestVisitDay, type ExistingTripView } from "./tripIngestPlan";

const trip = (id: string, startDate: string, endDate: string): ExistingTripView => ({
  id,
  startDate,
  endDate,
});

describe("planIngestVisitDay", () => {
  it("date가 기존 트립 안에 들어가면 noop", () => {
    const plan = planIngestVisitDay({
      date: "2024-05-03",
      containing: trip("t1", "2024-05-01", "2024-05-05"),
      left: null,
      right: null,
    });
    expect(plan).toEqual({ kind: "noop", tripId: "t1" });
  });

  it("trip 시작일과 정확히 같은 날도 noop", () => {
    const plan = planIngestVisitDay({
      date: "2024-05-01",
      containing: trip("t1", "2024-05-01", "2024-05-05"),
      left: null,
      right: null,
    });
    expect(plan).toEqual({ kind: "noop", tripId: "t1" });
  });

  it("바로 직전에 끝나는 트립이 있으면 그쪽으로 확장", () => {
    const plan = planIngestVisitDay({
      date: "2024-05-06",
      containing: null,
      left: trip("t1", "2024-05-01", "2024-05-05"),
      right: null,
    });
    expect(plan).toEqual({
      kind: "extend",
      tripId: "t1",
      newStart: "2024-05-01",
      newEnd: "2024-05-06",
    });
  });

  it("바로 직후에 시작하는 트립이 있으면 그쪽으로 확장", () => {
    const plan = planIngestVisitDay({
      date: "2024-05-06",
      containing: null,
      left: null,
      right: trip("t2", "2024-05-07", "2024-05-10"),
    });
    expect(plan).toEqual({
      kind: "extend",
      tripId: "t2",
      newStart: "2024-05-06",
      newEnd: "2024-05-10",
    });
  });

  it("양쪽 인접 트립이 다 있으면 left 유지하고 right 흡수해 병합", () => {
    const plan = planIngestVisitDay({
      date: "2024-05-06",
      containing: null,
      left: trip("t1", "2024-05-01", "2024-05-05"),
      right: trip("t2", "2024-05-07", "2024-05-10"),
    });
    expect(plan).toEqual({
      kind: "merge",
      keepId: "t1",
      absorbId: "t2",
      newStart: "2024-05-01",
      newEnd: "2024-05-10",
    });
  });

  it("아무 트립도 없으면 단일일 트립 신규 생성", () => {
    const plan = planIngestVisitDay({
      date: "2024-05-06",
      containing: null,
      left: null,
      right: null,
    });
    expect(plan).toEqual({ kind: "create", date: "2024-05-06" });
  });

  it("containing이 있으면 left/right가 같이 들어와도 noop이 우선", () => {
    // 호출 측이 containing 검색을 게을리해 left/right만 채워 보내도, plan은 안전하게 noop.
    const plan = planIngestVisitDay({
      date: "2024-05-03",
      containing: trip("t1", "2024-05-01", "2024-05-05"),
      left: trip("t2", "2024-04-29", "2024-05-02"),
      right: trip("t3", "2024-05-04", "2024-05-08"),
    });
    expect(plan).toEqual({ kind: "noop", tripId: "t1" });
  });
});
