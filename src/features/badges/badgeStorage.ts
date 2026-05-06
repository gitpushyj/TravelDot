import AsyncStorage from "@react-native-async-storage/async-storage";

import type { BadgeId } from "./badges";

const UNLOCKED_KEY = "visitgrid:badges:unlocked";
const ACTIVE_KEY = "visitgrid:badges:active";
// 평가 로직 변경(예: 등급/대륙의 회고 누적 emit) 시 키를 bump하면 기존 사용자도
// 한 번은 silent re-seed를 거쳐 알림 폭증을 방지한다.
const SEEDED_KEY = "visitgrid:badges:seeded_v2";

export type StoredBadgeState = {
  unlocked: BadgeId[];
  active: BadgeId | null;
  /** 첫 평가가 끝났는지 — false인 동안에는 새 뱃지 알림을 묵음 처리한다. */
  seeded: boolean;
};

export async function loadBadgeState(): Promise<StoredBadgeState> {
  const [u, a, s] = await Promise.all([
    AsyncStorage.getItem(UNLOCKED_KEY),
    AsyncStorage.getItem(ACTIVE_KEY),
    AsyncStorage.getItem(SEEDED_KEY),
  ]);
  let unlocked: BadgeId[] = [];
  if (u) {
    try {
      const parsed = JSON.parse(u);
      if (Array.isArray(parsed)) unlocked = parsed.filter((x) => typeof x === "string");
    } catch {
      // 손상된 데이터는 빈 배열로 폴백 — 다음 평가 사이클에서 재구성된다.
    }
  }
  return {
    unlocked,
    active: a || null,
    seeded: s === "1",
  };
}

export async function saveUnlocked(unlocked: BadgeId[]): Promise<void> {
  await AsyncStorage.setItem(UNLOCKED_KEY, JSON.stringify(unlocked));
}

export async function saveActive(id: BadgeId | null): Promise<void> {
  if (id == null) {
    await AsyncStorage.removeItem(ACTIVE_KEY);
  } else {
    await AsyncStorage.setItem(ACTIVE_KEY, id);
  }
}

export async function markSeeded(): Promise<void> {
  await AsyncStorage.setItem(SEEDED_KEY, "1");
}
