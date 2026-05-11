import { evaluateUnLinguist } from "./unLinguist";

jest.mock("../../../badges/data", () => ({
  OFFICIAL_LANGUAGES_BY_CODE: {
    KR: [], JP: [], US: ["en"], FR: ["fr"], CN: ["zh"], EG: ["ar"], BR: ["fr"],
    MX: ["es"], RU: ["ru"],
  },
}));

import type { PremiumContext } from "../types";
function ctx(codes: string[]): PremiumContext {
  return {
    homeCountry: null, photos: [],
    visitedCountriesCount: codes.length, visitedCountryCodes: codes,
  };
}

describe("evaluateUnLinguist", () => {
  it("emits trilingual at 3 languages", () => {
    const ids = evaluateUnLinguist(ctx(["US", "FR", "CN"])).map((b) => b.id);
    expect(ids).toContain("premium_un_linguist_3");
  });
  it("emits full at 6 languages", () => {
    const ids = evaluateUnLinguist(ctx(["US","FR","CN","EG","MX","RU"])).map((b) => b.id);
    expect(ids).toContain("premium_un_linguist_6");
  });
});
