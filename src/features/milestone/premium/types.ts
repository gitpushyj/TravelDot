export type Season = "spring" | "summer" | "autumn" | "winter";

/** 사진 한 장의 평가용 메타. tripDb의 visit_photos 한 행에서 가공된다. */
export type PremiumPhoto = {
  countryCode: string;
  takenAtMs: number;
};

/** 평가 함수에 주입되는 모든 사용자 고유 데이터. */
export type PremiumContext = {
  homeCountry: string | null;
  /** 본국 포함 모든 사진 (정렬 가정 없음) */
  photos: PremiumPhoto[];
  /** 누적 방문국 수 (본국 포함) */
  visitedCountriesCount: number;
  /** 본국 포함 방문국 코드 목록 */
  visitedCountryCodes: string[];
};
