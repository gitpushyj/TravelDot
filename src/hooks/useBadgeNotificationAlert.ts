import { useEffect } from "react";
import { Alert } from "react-native";
import { useTranslation } from "react-i18next";

import { useBadgeStore } from "../features/badges/badgeStore";

// 새로 잠금 해제된 뱃지가 여러 개여도 한 번의 알림으로 묶어서 표시한다.
// 스캔 한 번에 호칭이 여러 개 풀릴 수 있어 팝업이 연달아 뜨는 것을 막기 위함.
export function useBadgeNotificationAlert() {
  const { t } = useTranslation();
  const pendingNotifications = useBadgeStore((s) => s.pendingNotifications);
  const consumeBadgeNotifications = useBadgeStore(
    (s) => s.consumeNotifications
  );

  useEffect(() => {
    const count = pendingNotifications.length;
    if (count === 0) return;
    const batch = pendingNotifications.slice(0, count);
    const title =
      count === 1
        ? t("badges.newSingleTitle")
        : t("badges.newMultipleTitle", { count });
    const body =
      count === 1
        ? t("badges.newSingleBody", {
            emoji: batch[0].emoji,
            title: batch[0].titleKo,
            description: batch[0].description,
          })
        : t("badges.newMultipleBody", {
            list: batch.map((b) => `${b.emoji}  ${b.titleKo}`).join("\n"),
          });
    Alert.alert(title, body, [
      { text: t("common.ok"), onPress: () => consumeBadgeNotifications(count) },
    ]);
  }, [pendingNotifications, consumeBadgeNotifications, t]);
}
