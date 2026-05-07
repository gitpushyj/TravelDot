import { useEffect } from "react";

import { useAuthStore } from "../auth/authStore";
import { COUNTRY_NAME_KO_BY_CODE } from "../badges/countryNames";
import { useVisitStore } from "../travel/visitStore";

import { useProfileStore } from "./profileStore";
import { loadUserProfileFromDb } from "./saveUserProfile";

// 로그인 직후(또는 앱 시작 시 세션 복원 직후) DB에서 사용자 프로필을 가져와
// 로컬 store에 채운다. 재설치 후 재로그인 시 본국/생년월일/성별 단계를 다시
// 묻지 않기 위한 핵심 동기화 지점이다. DB 값이 권위 출처이므로 로컬과 다르면
// 덮어쓴다 — 다른 계정으로의 전환을 자연스럽게 처리하기 위함.
export function useHydrateUserProfileFromDb(): void {
  const userId = useAuthStore((s) => s.user?.id);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    void (async () => {
      try {
        const dbProfile = await loadUserProfileFromDb(userId);
        if (cancelled || !dbProfile) return;

        useVisitStore.getState().setHomeChanged(dbProfile.homeCountryChanged);

        if (dbProfile.homeCountryCode) {
          const localHome = useVisitStore.getState().homeCountry;
          if (
            !localHome ||
            localHome.code !== dbProfile.homeCountryCode
          ) {
            const name =
              COUNTRY_NAME_KO_BY_CODE[dbProfile.homeCountryCode] ??
              dbProfile.homeCountryCode;
            await useVisitStore.getState().setHomeCountry({
              code: dbProfile.homeCountryCode,
              name,
            });
          }
        }

        if (
          dbProfile.birthYear != null &&
          dbProfile.birthMonth != null &&
          dbProfile.birthDay != null &&
          dbProfile.gender != null
        ) {
          const local = useProfileStore.getState().profile;
          const same =
            local !== null &&
            local.birthYear === dbProfile.birthYear &&
            local.birthMonth === dbProfile.birthMonth &&
            local.birthDay === dbProfile.birthDay &&
            local.gender === dbProfile.gender;
          if (!same) {
            await useProfileStore.getState().setProfile({
              birthYear: dbProfile.birthYear,
              birthMonth: dbProfile.birthMonth,
              birthDay: dbProfile.birthDay,
              gender: dbProfile.gender,
            });
          }
        }
      } catch (e) {
        // 네트워크/RLS 오류 등으로 실패해도 앱은 계속 동작한다. 다음 인증 변경
        // 시 자연스럽게 재시도된다.
        console.warn("[user] failed to hydrate profile from DB", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);
}
