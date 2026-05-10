import { useEffect } from "react";
import { Alert } from "react-native";
import { useTranslation } from "react-i18next";

import {
  localizedBadgeDescription,
  localizedBadgeTitle,
} from "../features/badges/badgeI18n";
import { useBadgeStore } from "../features/badges/badgeStore";
import { useOnboardingStore } from "../features/onboarding/onboardingStore";
import { getCurrentLocale } from "../i18n";

// 새로 잠금 해제된 뱃지가 여러 개여도 한 번의 알림으로 묶어서 표시한다.
// 스캔 한 번에 호칭이 여러 개 풀릴 수 있어 팝업이 연달아 뜨는 것을 막기 위함.
export function useBadgeNotificationAlert() {
  const { t } = useTranslation();
  const pendingNotifications = useBadgeStore((s) => s.pendingNotifications);
  const consumeBadgeNotifications = useBadgeStore(
    (s) => s.consumeNotifications
  );
  const onboardingCompleted = useOnboardingStore((s) => s.completed);
  const onboardingLastStep = useOnboardingStore((s) => s.lastStep);

  useEffect(() => {
    // 온보딩 진행 중(1~4단계)에는 뱃지 알림을 보류한다. 4단계 사진 sync 도중
    // 호칭이 풀려 팝업이 떠도 sync는 아직 끝나지 않은 상태라, 사용자가 확인을
    // 눌러도 4/5에 머물러 멈춘 듯한 경험이 된다. 5단계(SuspectTripsStep)로
    // 진입하거나 온보딩이 완료된 뒤에만 알림을 띄운다 — pendingNotifications
    // 큐는 보존되므로 다음 발화 시점에 누락 없이 재평가된다.
    if (!onboardingCompleted && onboardingLastStep < 5) return;
    const count = pendingNotifications.length;
    if (count === 0) return;
    const batch = pendingNotifications.slice(0, count);
    const locale = getCurrentLocale();
    const title =
      count === 1
        ? t("badges.newSingleTitle")
        : t("badges.newMultipleTitle", { count });
    const body =
      count === 1
        ? t("badges.newSingleBody", {
            emoji: batch[0].emoji,
            title: localizedBadgeTitle(batch[0], t, locale),
            description: localizedBadgeDescription(batch[0], t, locale),
          })
        : t("badges.newMultipleBody", {
            list: batch
              .map(
                (b) => `${b.emoji}  ${localizedBadgeTitle(b, t, locale)}`
              )
              .join("\n"),
          });
    Alert.alert(title, body, [
      { text: t("common.ok"), onPress: () => consumeBadgeNotifications(count) },
    ]);
  }, [
    pendingNotifications,
    consumeBadgeNotifications,
    t,
    onboardingCompleted,
    onboardingLastStep,
  ]);
}
