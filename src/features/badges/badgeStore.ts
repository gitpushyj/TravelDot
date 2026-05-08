import { create } from "zustand";

import {
  badgeFromId,
  BadgeDefinition,
  BadgeId,
  BadgeStats,
  evaluateBadges,
  sortBadges,
} from "./badges";
import {
  loadBadgeState,
  markSeeded,
  saveActive,
  saveUnlocked,
} from "./badgeStorage";

type State = {
  /** 잠금 해제된 뱃지 ID 집합 */
  unlocked: BadgeId[];
  /** 사용자가 선택한 활성 뱃지 ID. null이면 등급 뱃지를 자동 사용 */
  activeId: BadgeId | null;
  /** 첫 평가 후 true. 첫 평가 전에는 retroactive unlock을 묵음 처리한다 */
  seeded: boolean;
  /** 마지막 평가에서 새로 잠금 해제되어 아직 사용자가 보지 않은 뱃지 큐 */
  pendingNotifications: BadgeDefinition[];

  hydrated: boolean;
  hydrate: () => Promise<void>;
  /** 뱃지를 재평가하고, 새 뱃지가 있으면 알림 큐에 적재한다 */
  evaluate: (
    stats: BadgeStats,
    countryNameByCode: Record<string, string>,
    premium?: BadgeDefinition[]
  ) => Promise<BadgeDefinition[]>;
  setActive: (id: BadgeId | null) => Promise<void>;
  /** 알림 큐에서 앞에서부터 N개 제거 (기본 1) */
  consumeNotifications: (count?: number) => void;
};

export const useBadgeStore = create<State>((set, get) => ({
  unlocked: [],
  activeId: null,
  seeded: false,
  pendingNotifications: [],
  hydrated: false,

  hydrate: async () => {
    const s = await loadBadgeState();
    set({
      unlocked: s.unlocked,
      activeId: s.active,
      seeded: s.seeded,
      hydrated: true,
    });
  },

  evaluate: async (stats, countryNameByCode, premium = []) => {
    const evaluated = evaluateBadges(stats, countryNameByCode, premium);
    const evalIds = evaluated.map((b) => b.id);
    const evalSet = new Set(evalIds);

    const prev = get().unlocked;
    const prevSet = new Set(prev);

    // 새로 잠금 해제된 항목 (이전에 없던 것만)
    const newlyUnlocked = evaluated.filter((b) => !prevSet.has(b.id));

    // 잠금 해제 집합은 누적 — 한 번 얻은 뱃지는 사라지지 않는다.
    // 단 동적 뱃지(국가 단골 등)는 해당 국가 일수가 줄어들면 정의 자체가 사라지므로
    // 그 경우엔 카탈로그에서 빠져도 unlocked 목록에는 보존(회고 뱃지)한다.
    const merged = Array.from(new Set([...prev, ...evalIds]));

    const seeded = get().seeded;
    const newQueueAdditions = seeded ? newlyUnlocked : [];

    set((s) => ({
      unlocked: merged,
      pendingNotifications: [...s.pendingNotifications, ...newQueueAdditions],
    }));

    await saveUnlocked(merged);
    if (!seeded) {
      await markSeeded();
      set({ seeded: true });
    }

    return evaluated;
  },

  setActive: async (id) => {
    set({ activeId: id });
    await saveActive(id);
  },

  consumeNotifications: (count = 1) => {
    set((s) => ({ pendingNotifications: s.pendingNotifications.slice(count) }));
  },
}));

/**
 * 활성 뱃지를 결정한다. 사용자 선택이 없으면 등급 뱃지(현재 등급)를 자동으로 노출.
 * countryNameByCode는 동적 뱃지 라벨 복원용.
 */
export function pickActiveBadge(
  activeId: BadgeId | null,
  fallbackTierBadgeId: BadgeId,
  countryNameByCode: Record<string, string>
): BadgeDefinition | null {
  const id = activeId ?? fallbackTierBadgeId;
  return badgeFromId(id, countryNameByCode);
}

export { sortBadges };
