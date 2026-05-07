import React, { useEffect, useMemo, useState } from "react";
import { BackHandler, View } from "react-native";

import { useAuthStore } from "../../features/auth/authStore";
import { useOnboardingStore } from "../../features/onboarding/onboardingStore";
import { useVisitStore } from "../../features/travel/visitStore";
import { useTheme } from "../../theme/themeStore";

import HomeCountryStep from "./HomeCountryStep";
import LoginStep from "./LoginStep";
import OnboardingProgress from "./OnboardingProgress";
import { makeOnboardingStyles } from "./styles";
import SuspectTripsStep from "./SuspectTripsStep";
import SyncStep from "./SyncStep";
import WelcomeStep from "./WelcomeStep";

const TOTAL_STEPS = 5;

export default function OnboardingFlow() {
  const theme = useTheme();
  const styles = useMemo(() => makeOnboardingStyles(theme), [theme]);

  const authUser = useAuthStore((s) => s.user);
  const homeCountry = useVisitStore((s) => s.homeCountry);
  const markCompleted = useOnboardingStore((s) => s.markCompleted);

  // 초기 step 결정: 이미 완료된 단계는 자동 skip.
  // welcome(1)은 항상 보여주는 게 자연스러우므로 welcome은 skip 대상에서 제외한다.
  const [step, setStep] = useState<number>(1);

  // 시스템 back 차단 (Android). 편도 플로우.
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => sub.remove();
  }, []);

  // 외부 상태(예: 다른 디바이스에서 세션 복원, 잔존 homeCountry)를 보고
  // step을 앞당긴다. 뒤로 돌리지는 않는다.
  useEffect(() => {
    setStep((prev) => {
      let next = prev;
      if (next < 3 && authUser) next = 3;
      if (next < 4 && homeCountry) next = 4;
      return next;
    });
  }, [authUser, homeCountry]);

  // step을 절대값으로 advance한다. step 컴포넌트의 onNext와 외부 상태 useEffect가
  // 동시에 발동해도 race 없이 정확한 step에 안착한다. 예: step 3에서 본국 선택 시
  // HomeCountryStep이 onNext(=goTo(4))를 부르고 OnboardingFlow useEffect도
  // homeCountry 변화를 보고 setStep(4)를 시도하는데, 둘 다 4로 수렴해 5로 튀지 않는다.
  const goTo = (target: number) =>
    setStep((s) => Math.max(s, Math.min(target, TOTAL_STEPS)));

  const finish = async () => {
    await markCompleted();
  };

  return (
    <View style={styles.root}>
      <OnboardingProgress current={step} total={TOTAL_STEPS} />
      {step === 1 && <WelcomeStep onNext={() => goTo(2)} />}
      {step === 2 && <LoginStep onNext={() => goTo(3)} />}
      {step === 3 && <HomeCountryStep onNext={() => goTo(4)} />}
      {step === 4 && <SyncStep onNext={() => goTo(5)} />}
      {step === 5 && <SuspectTripsStep onFinish={() => void finish()} />}
    </View>
  );
}
