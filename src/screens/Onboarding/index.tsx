import React, { useEffect, useMemo, useState } from "react";
import { Alert, BackHandler, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useAuthStore } from "../../features/auth/authStore";
import { useOnboardingStore } from "../../features/onboarding/onboardingStore";
import { useProfileStore } from "../../features/onboarding/profileStore";
import { saveUserProfileToDb } from "../../features/onboarding/saveUserProfile";
import { useVisitStore } from "../../features/travel/visitStore";
import { useScreenBottomInset } from "../../hooks/useScreenInsets";
import { useTheme } from "../../theme/themeStore";

import BirthGenderStep from "./BirthGenderStep";
import HomeCountryStep from "./HomeCountryStep";
import LoginStep from "./LoginStep";
import OnboardingProgress from "./OnboardingProgress";
import { makeOnboardingStyles } from "./styles";
import SuspectTripsStep from "./SuspectTripsStep";
import SyncStep from "./SyncStep";

const TOTAL_STEPS = 5;

export default function OnboardingFlow() {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => makeOnboardingStyles(theme), [theme]);
  const bottomInset = useScreenBottomInset();

  const authUser = useAuthStore((s) => s.user);
  const homeCountry = useVisitStore((s) => s.homeCountry);
  const profile = useProfileStore((s) => s.profile);
  const profileHydrated = useProfileStore((s) => s.hydrated);
  const profileHydrate = useProfileStore((s) => s.hydrate);
  const markCompleted = useOnboardingStore((s) => s.markCompleted);

  // 초기 step 결정: 이미 완료된 단계는 자동 skip.
  // step 1(LoginStep)은 환영+로그인 통합 화면. 로그인이 이미 돼 있으면 effect가 step=2로 당긴다.
  const [step, setStep] = useState<number>(1);

  // 시스템 back: step 1(LoginStep)에서는 Android 기본 동작(앱 종료)을 허용한다.
  // step 2 이상은 사용자가 이미 입력한 진행 데이터를 보호하기 위해 차단한다(편도 플로우).
  useEffect(() => {
    const sub = BackHandler.addEventListener(
      "hardwareBackPress",
      () => step > 1,
    );
    return () => sub.remove();
  }, [step]);

  // profile 저장은 로컬 캐시이므로 onboarding 진입 시 hydrate해 둔다.
  useEffect(() => {
    if (!profileHydrated) void profileHydrate();
  }, [profileHydrated, profileHydrate]);

  // 외부 상태(예: 다른 디바이스에서 세션 복원, 잔존 homeCountry)를 보고
  // step을 앞당긴다. 뒤로 돌리지는 않는다.
  useEffect(() => {
    setStep((prev) => {
      let next = prev;
      if (next < 2 && authUser) next = 2;
      if (next < 3 && homeCountry) next = 3;
      if (next < 4 && profile) next = 4;
      return next;
    });
  }, [authUser, homeCountry, profile]);

  // step을 절대값으로 advance한다. step 컴포넌트의 onNext와 외부 상태 useEffect가
  // 동시에 발동해도 race 없이 정확한 step에 안착한다. 예: step 2에서 본국 선택 시
  // HomeCountryStep이 onNext(=goTo(3))를 부르고 OnboardingFlow useEffect도
  // homeCountry 변화를 보고 setStep(3)를 시도하는데, 둘 다 3으로 수렴해 4로 튀지 않는다.
  const goTo = (target: number) =>
    setStep((s) => Math.max(s, Math.min(target, TOTAL_STEPS)));

  const finish = async () => {
    // 온보딩 완료 시점에 사용자 프로필을 DB에 저장한다.
    // 네트워크/RLS 오류 등으로 실패해도 온보딩 완료는 막지 않는다 — 다음 진입 시 재시도 가능.
    try {
      if (authUser && homeCountry && profile) {
        await saveUserProfileToDb({
          userId: authUser.id,
          homeCountry,
          profile,
        });
      }
    } catch (e) {
      Alert.alert(t("alerts.saveFailed"), String(e));
    }
    await markCompleted();
  };

  return (
    <View style={[styles.root, { paddingBottom: bottomInset }]}>
      <OnboardingProgress current={step} total={TOTAL_STEPS} />
      {step === 1 && <LoginStep onNext={() => goTo(2)} />}
      {step === 2 && <HomeCountryStep onNext={() => goTo(3)} />}
      {step === 3 && <BirthGenderStep onNext={() => goTo(4)} />}
      {step === 4 && <SyncStep onNext={() => goTo(5)} />}
      {step === 5 && <SuspectTripsStep onFinish={() => void finish()} />}
    </View>
  );
}
