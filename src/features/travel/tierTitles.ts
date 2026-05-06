// 등급(Tier) 호칭 정의
// 기획서 §3 참조: docs/마일스톤_뱃지_기획서.md
//
// 컷오프는 "본국 포함" 카운트 기준으로 잡혀 있다.
// 외부 통계(해외 방문 기준)에 +1 환산하여 정렬한 값이며,
// 상위 절대 기준점(50/75/100/150/193)은 +1 환산 대상이 아니다.

export type TierId =
  | "T0"
  | "T1"
  | "T2"
  | "T3"
  | "T4"
  | "T5"
  | "T6"
  | "T7"
  | "T8"
  | "T9"
  | "T10"
  | "MASTER"
  | "GRANDMASTER"
  | "LEGEND"
  | "UN_MASTER";

export type TierDefinition = {
  id: TierId;
  /** 이 등급에 진입하기 위한 최소 방문 국가 수 (포함) */
  threshold: number;
  /** 한국어 호칭 (UI 노출용) */
  titleKo: string;
  /** 영어 호칭 (i18n / 공유 카드 등) */
  titleEn: string;
  /** 한 줄 설명 — 등급 상세 화면용 */
  description: string;
  /** 명예 등급 단계. 1=Master, 2=Grandmaster, 3=Legend, 4=UN Master */
  prestige?: 1 | 2 | 3 | 4;
};

// 내림차순 정렬 — `getTierByCount`에서 위에서부터 매칭
export const TIERS: readonly TierDefinition[] = [
  {
    id: "UN_MASTER",
    threshold: 193,
    titleKo: "UN 마스터",
    titleEn: "UN Master",
    description: "지구 위 모든 국기를 모은 사람",
    prestige: 4,
  },
  {
    id: "LEGEND",
    threshold: 150,
    titleKo: "레전드",
    titleEn: "Legend",
    description: "전설로 남는 발걸음",
    prestige: 3,
  },
  {
    id: "GRANDMASTER",
    threshold: 100,
    titleKo: "그랜드마스터",
    titleEn: "Grandmaster",
    description: "100개국의 발자취 — TCC 가입선",
    prestige: 2,
  },
  {
    id: "MASTER",
    threshold: 75,
    titleKo: "마스터",
    titleEn: "Master",
    description: "여행 그 자체가 된 사람",
    prestige: 1,
  },
  {
    id: "T10",
    threshold: 50,
    titleKo: "월드 컬렉터",
    titleEn: "World Collector",
    description: "세계를 수집하는 사람 — 상위 1%",
  },
  {
    id: "T9",
    threshold: 36,
    titleKo: "세계인",
    titleEn: "Globetrotter",
    description: "지구 위 어디든 집처럼 느끼는",
  },
  {
    id: "T8",
    threshold: 22,
    titleKo: "노마드",
    titleEn: "Nomad",
    description: "정착보다 이동이 자연스러운",
  },
  {
    id: "T7",
    threshold: 14,
    titleKo: "베테랑",
    titleEn: "Veteran",
    description: "여행을 업처럼 다루는",
  },
  {
    id: "T6",
    threshold: 9,
    titleKo: "탐험가",
    titleEn: "Explorer",
    description: "낯선 곳이 더 이상 두렵지 않은",
  },
  {
    id: "T5",
    threshold: 6,
    titleKo: "여행자",
    titleEn: "Traveler",
    description: "글로벌 평균을 넘어선 여행자",
  },
  {
    id: "T4",
    threshold: 4,
    titleKo: "길손",
    titleEn: "Wayfarer",
    description: "여행이 슬슬 익숙해지는",
  },
  {
    id: "T3",
    threshold: 3,
    titleKo: "산책자",
    titleEn: "Stroller",
    description: "거리에 얽매이지 않고 발걸음을 넓혀가는",
  },
  {
    id: "T2",
    threshold: 2,
    titleKo: "첫걸음",
    titleEn: "First Step",
    description: "국경을 넘은 첫 발걸음",
  },
  {
    id: "T1",
    threshold: 1,
    titleKo: "정착민",
    titleEn: "Settler",
    description: "본국에 첫 발자취를 남긴 사람",
  },
  {
    id: "T0",
    threshold: 0,
    titleKo: "여행 준비 중",
    titleEn: "Getting Ready",
    description: "아직 기록된 발자취가 없는",
  },
];

/**
 * 방문 국가 수(본국 포함)로 현재 등급 계산.
 * 0개국이어도 T0("여행 준비 중")을 반환하므로 호출부에서 별도 분기 불필요.
 */
export function getTierByCount(count: number): TierDefinition {
  for (const t of TIERS) {
    if (count >= t.threshold) return t;
  }
  return TIERS[TIERS.length - 1];
}

/**
 * 마일스톤 컷오프 (오름차순). 다음 등급까지의 거리 계산용.
 * `MILESTONES`(기존 `App.tsx`의 임의 배열)를 대체한다.
 */
export const TIER_CUTOFFS: readonly number[] = TIERS.map((t) => t.threshold)
  .filter((n) => n > 0)
  .sort((a, b) => a - b);
