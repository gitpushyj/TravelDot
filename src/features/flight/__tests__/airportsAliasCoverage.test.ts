import { searchAirports } from "../airports";

// 1,000+ 공항 데이터셋 위에서 한국어/별칭 매칭이 의도대로 동작하는지 확인.
// 도시명 정규화(괄호·쉼표 제거)와 IATA 별칭 매핑이 합쳐서 작동해야 한다.
describe("airport KO alias coverage on full dataset", () => {
  const expectContains = (query: string, expected: string[]) => {
    const codes = searchAirports(query, 60).map((a) => a.iata);
    for (const c of expected) expect(codes).toContain(c);
  };

  it("서울 → ICN, GMP", () => expectContains("서울", ["ICN", "GMP"]));
  it("부산 → PUS", () => expectContains("부산", ["PUS"]));
  it("제주 → CJU", () => expectContains("제주", ["CJU"]));
  it("도쿄 → NRT + HND", () => expectContains("도쿄", ["NRT", "HND"]));
  it("오사카 → KIX + ITM", () => expectContains("오사카", ["KIX", "ITM"]));
  it("후쿠오카 → FUK", () => expectContains("후쿠오카", ["FUK"]));
  it("상하이 → PVG + SHA", () => expectContains("상하이", ["PVG", "SHA"]));
  it("베이징 → PEK + PKX", () => expectContains("베이징", ["PEK", "PKX"]));
  it("타이베이 → TPE + TSA", () => expectContains("타이베이", ["TPE", "TSA"]));
  it("홍콩 → HKG", () => expectContains("홍콩", ["HKG"]));
  it("마카오 → MFM", () => expectContains("마카오", ["MFM"]));
  it("방콕 → BKK + DMK", () => expectContains("방콕", ["BKK", "DMK"]));
  it("싱가포르 → SIN", () => expectContains("싱가포르", ["SIN"]));
  it("쿠알라룸푸르 → KUL", () => expectContains("쿠알라룸푸르", ["KUL"]));
  it("발리 → DPS", () => expectContains("발리", ["DPS"]));
  it("자카르타 → CGK", () => expectContains("자카르타", ["CGK"]));
  it("마닐라 → MNL", () => expectContains("마닐라", ["MNL"]));
  it("하노이 → HAN", () => expectContains("하노이", ["HAN"]));
  it("호치민 → SGN", () => expectContains("호치민", ["SGN"]));
  it("뉴욕 → JFK + LGA + EWR", () =>
    expectContains("뉴욕", ["JFK", "LGA", "EWR"]));
  it("런던 → LHR + LGW", () => expectContains("런던", ["LHR", "LGW"]));
  it("파리 → CDG + ORY", () => expectContains("파리", ["CDG", "ORY"]));
  it("모스크바 → SVO + DME", () => expectContains("모스크바", ["SVO", "DME"]));
});
