import { evaluatePremiumProgress } from "./evaluatePremiumProgress";
import type { PremiumContext, PremiumPhoto } from "./types";

const baseCtx: PremiumContext = {
  homeCountry: "KR",
  photos: [],
  visitedCountriesCount: 0,
  visitedCountryCodes: [],
};

describe("evaluatePremiumProgress - humanity", () => {
  it("0% 진행: current=0, next=25, percent=0, unit=percent", () => {
    const p = evaluatePremiumProgress("premium_humanity", { ...baseCtx, visitedCountryCodes: [] });
    expect(p.current).toBe(0);
    expect(p.next).toBe(25);
    expect(p.percent).toBe(0);
    expect(p.unit).toBe("percent");
    expect(p.nextTitleBadgeId).toBe("premium_humanity_25");
    expect(p.reachedFinal).toBe(false);
    expect(p.unsupportedReason).toBeNull();
  });

  it("CN+IN 방문 시 ~35% → next=50으로 이동", () => {
    const p = evaluatePremiumProgress("premium_humanity", { ...baseCtx, visitedCountryCodes: ["CN", "IN"] });
    expect(p.current).toBeGreaterThanOrEqual(25);
    expect(p.current).toBeLessThan(50);
    expect(p.next).toBe(50);
    expect(p.nextTitleBadgeId).toBe("premium_humanity_50");
    expect(p.reachedFinal).toBe(false);
  });

  it("인구 상위 28개국 방문 시 75% 초과 → reachedFinal=true", () => {
    // 데이터 검증: 상위 28개국 누적 75.70%
    const top28 = ["IN","CN","US","ID","PK","NG","BR","BD","RU","MX","ET","JP","PH","EG","CD","VN","IR","TR","DE","TH","GB","TZ","FR","ZA","IT","KE","MM","CO"];
    const p = evaluatePremiumProgress("premium_humanity", { ...baseCtx, visitedCountryCodes: top28 });
    expect(p.reachedFinal).toBe(true);
    expect(p.next).toBeNull();
  });
});

describe("evaluatePremiumProgress - earth_area", () => {
  it("0% 진행", () => {
    const p = evaluatePremiumProgress("premium_earth_area", { ...baseCtx, visitedCountryCodes: [] });
    expect(p.current).toBe(0);
    expect(p.next).toBe(25);
    expect(p.unit).toBe("percent");
    expect(p.nextTitleBadgeId).toBe("premium_earth_25");
  });

  it("러시아만 방문해도 25% 미만", () => {
    const p = evaluatePremiumProgress("premium_earth_area", { ...baseCtx, visitedCountryCodes: ["RU"] });
    expect(p.next).toBe(25);
    expect(p.current).toBeLessThan(25);
    expect(p.current).toBeGreaterThan(0);
  });
});

describe("evaluatePremiumProgress - calendar", () => {
  const photo = (countryCode: string, month1to12: number): PremiumPhoto => ({
    countryCode,
    takenAtMs: new Date(2025, month1to12 - 1, 15).getTime(),
  });

  it("homeCountry 없으면 needs_home_country", () => {
    const p = evaluatePremiumProgress("premium_calendar", { ...baseCtx, homeCountry: null });
    expect(p.unsupportedReason).toBe("needs_home_country");
    expect(p.unit).toBe("months");
  });

  it("본국 사진은 카운트하지 않음", () => {
    const p = evaluatePremiumProgress("premium_calendar", {
      ...baseCtx,
      homeCountry: "KR",
      photos: [photo("KR", 1), photo("KR", 6), photo("JP", 3)],
    });
    expect(p.current).toBe(1);
    expect(p.next).toBe(6);
    expect(p.unit).toBe("months");
    expect(p.nextTitleBadgeId).toBe("premium_calendar_6");
  });

  it("6개월 채우면 다음 컷오프 12로 이동", () => {
    const photos = [1, 2, 3, 4, 5, 6].map((m) => photo("JP", m));
    const p = evaluatePremiumProgress("premium_calendar", { ...baseCtx, photos });
    expect(p.current).toBe(6);
    expect(p.next).toBe(12);
    expect(p.nextTitleBadgeId).toBe("premium_calendar_12");
  });

  it("12개월 모두 채우면 reachedFinal", () => {
    const photos = Array.from({ length: 12 }, (_, i) => photo("JP", i + 1));
    const p = evaluatePremiumProgress("premium_calendar", { ...baseCtx, photos });
    expect(p.reachedFinal).toBe(true);
    expect(p.next).toBeNull();
  });
});

describe("evaluatePremiumProgress - flag_palette", () => {
  it("0색", () => {
    const p = evaluatePremiumProgress("premium_flag_palette", { ...baseCtx, visitedCountryCodes: [] });
    expect(p.current).toBe(0);
    expect(p.next).toBe(5);
    expect(p.unit).toBe("colors");
    expect(p.nextTitleBadgeId).toBe("premium_flag_palette_5");
  });

  it("KR 국기는 4색 → next=5 미달", () => {
    const p = evaluatePremiumProgress("premium_flag_palette", { ...baseCtx, visitedCountryCodes: ["KR"] });
    expect(p.current).toBe(4);
    expect(p.next).toBe(5);
  });

  it("BR+KR+IE 조합으로 7색 모두 → reachedFinal", () => {
    const p = evaluatePremiumProgress("premium_flag_palette", {
      ...baseCtx,
      visitedCountryCodes: ["BR", "KR", "IE"],
    });
    expect(p.current).toBe(7);
    expect(p.reachedFinal).toBe(true);
  });
});

describe("evaluatePremiumProgress - un_linguist", () => {
  it("0언어", () => {
    const p = evaluatePremiumProgress("premium_un_linguist", { ...baseCtx, visitedCountryCodes: [] });
    expect(p.current).toBe(0);
    expect(p.next).toBe(3);
    expect(p.unit).toBe("languages");
    expect(p.nextTitleBadgeId).toBe("premium_un_linguist_3");
  });

  it("KR(공용어 데이터 없음) → 0", () => {
    const p = evaluatePremiumProgress("premium_un_linguist", { ...baseCtx, visitedCountryCodes: ["KR"] });
    expect(p.current).toBe(0);
  });

  it("US(en) + CN(zh) + ES(es) → 3 도달, next=6", () => {
    const p = evaluatePremiumProgress("premium_un_linguist", {
      ...baseCtx,
      visitedCountryCodes: ["US", "CN", "ES"],
    });
    expect(p.current).toBe(3);
    expect(p.next).toBe(6);
    expect(p.nextTitleBadgeId).toBe("premium_un_linguist_6");
  });

  it("UN 6공용어 모두 보유 시 reachedFinal", () => {
    const p = evaluatePremiumProgress("premium_un_linguist", {
      ...baseCtx,
      visitedCountryCodes: ["US", "CN", "ES", "FR", "RU", "EG"],
    });
    expect(p.current).toBe(6);
    expect(p.reachedFinal).toBe(true);
  });
});

describe("evaluatePremiumProgress - round_the_clock", () => {
  it("방문국 0개 → 0/24", () => {
    const p = evaluatePremiumProgress("premium_round_the_clock", { ...baseCtx, visitedCountryCodes: [] });
    expect(p.current).toBe(0);
    expect(p.next).toBe(24);
    expect(p.unit).toBe("hours");
    expect(p.nextTitleBadgeId).toBe("premium_round_the_clock");
  });

  it("KR(UTC+9) 단독 → max-min=0", () => {
    const p = evaluatePremiumProgress("premium_round_the_clock", { ...baseCtx, visitedCountryCodes: ["KR"] });
    expect(p.current).toBe(0);
    expect(p.next).toBe(24);
  });

  it("TO(UTC+13) + NU(UTC-11) → 24h → reachedFinal", () => {
    const p = evaluatePremiumProgress("premium_round_the_clock", {
      ...baseCtx,
      visitedCountryCodes: ["TO", "NU"],
    });
    expect(p.current).toBeGreaterThanOrEqual(24);
    expect(p.reachedFinal).toBe(true);
  });
});
