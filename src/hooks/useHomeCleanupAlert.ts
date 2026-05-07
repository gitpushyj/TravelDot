import { useEffect } from "react";
import { Alert } from "react-native";
import { useTranslation } from "react-i18next";

import { useVisitStore } from "../features/travel/visitStore";
import { getCurrentLocale } from "../i18n";
import { getCountryName } from "../lib/countryName";

// 본국 변경 시 기존 본국에서 자동 삭제된 일수/사진 수를 사용자에게 알려준다.
export function useHomeCleanupAlert() {
  const { t } = useTranslation();
  const homeCleanupReport = useVisitStore((s) => s.homeCleanupReport);
  const setHomeCleanupReport = useVisitStore((s) => s.setHomeCleanupReport);

  useEffect(() => {
    if (!homeCleanupReport) return;
    const koName = getCountryName(
      homeCleanupReport.countryCode,
      getCurrentLocale()
    );
    Alert.alert(
      t("homeCleanup.title"),
      t("homeCleanup.body", {
        country: koName,
        days: homeCleanupReport.daysDeleted,
        photos: homeCleanupReport.photosDeleted,
      }),
      [{ text: t("common.ok"), onPress: () => setHomeCleanupReport(null) }]
    );
  }, [homeCleanupReport, setHomeCleanupReport, t]);
}
