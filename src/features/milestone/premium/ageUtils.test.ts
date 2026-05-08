import { ageAtTimestamp } from "./ageUtils";

describe("ageAtTimestamp", () => {
  it("returns 0 for a photo taken on the birth day", () => {
    const birth = { year: 1995, month: 6, day: 15 };
    const taken = new Date(1995, 5, 15).getTime();
    expect(ageAtTimestamp(taken, birth)).toBe(0);
  });
  it("returns 19 the day before 20th birthday", () => {
    const birth = { year: 1995, month: 6, day: 15 };
    const taken = new Date(2015, 5, 14).getTime();
    expect(ageAtTimestamp(taken, birth)).toBe(19);
  });
  it("returns 20 on 20th birthday", () => {
    const birth = { year: 1995, month: 6, day: 15 };
    const taken = new Date(2015, 5, 15).getTime();
    expect(ageAtTimestamp(taken, birth)).toBe(20);
  });
  it("returns -1 for photos before birth", () => {
    const birth = { year: 1995, month: 6, day: 15 };
    const taken = new Date(1990, 0, 1).getTime();
    expect(ageAtTimestamp(taken, birth)).toBe(-1);
  });
});
