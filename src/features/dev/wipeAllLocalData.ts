import AsyncStorage from "@react-native-async-storage/async-storage";

import { useAuthStore } from "../auth/authStore";
import { useBadgeStore } from "../badges/badgeStore";
import { useOnboardingStore } from "../onboarding/onboardingStore";
import { wipeAllVisits } from "../travel/visit/maintenance";
import { useVisitStore } from "../travel/visitStore";
import { useThemeStore } from "../../theme/themeStore";

// 테스트 편의용 — 모든 로컬 데이터를 비우고 로그아웃해 온보딩 직전 상태로
// 되돌린다. 운영 빌드에서도 동작하지만 SettingsScreen의 "개발자" 섹션
// 안에서만 호출된다.
export async function wipeAllLocalData(): Promise<void> {
  // 1. 인증 로그아웃 — Google + Supabase 세션 해제. AsyncStorage를 비우기
  //    전에 호출해야 어댑터가 정상적으로 토큰을 정리할 수 있다.
  try {
    await useAuthStore.getState().signOut();
  } catch {
    // 로그아웃 실패해도 데이터 wipe는 계속 진행한다 (재시도 시 같은 상황 반복 방지).
  }

  // 2. SQLite 로 들어간 모든 방문 기록 비우기.
  await wipeAllVisits();

  // 3. AsyncStorage 전체 키 비우기 — 온보딩 플래그, 본국, 뱃지, 테마, 언어,
  //    Supabase 세션 흔적 등 모두 포함.
  await AsyncStorage.clear();

  // 4. 메모리에 남아있는 zustand 상태를 초기값으로 되돌린다. 그 다음 hydrate를
  //    다시 돌리면 비어있는 디스크 상태와 일치하게 채워진다. App.tsx 의 분기는
  //    onboardingCompleted=false + authUser=null 을 보고 OnboardingFlow를
  //    노출한다.
  useBadgeStore.setState({
    unlocked: [],
    activeId: null,
    seeded: false,
    pendingNotifications: [],
    hydrated: false,
  });
  useOnboardingStore.setState({ hydrated: false, completed: false });
  useVisitStore.setState({
    ready: false,
    homeCountry: null,
    homeChanged: false,
    visitCounts: {},
    visitCountsByYear: {},
    recentTrips: [],
    availableYears: [],
    syncStatus: { running: false, processed: 0 },
    lastSync: null,
    selectedCountry: null,
    homeCleanupReport: null,
    suspectTrips: [],
  });

  await useThemeStore.getState().hydrate();
  await useOnboardingStore.getState().hydrate();
  // visitStore.hydrate 내부에서 badgeStore.hydrate 를 먼저 호출한다.
  await useVisitStore.getState().hydrate();
}
