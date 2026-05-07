import { useEffect } from "react";
import { Alert } from "react-native";
import { useTranslation } from "react-i18next";

import { useVisitStore } from "../features/travel/visitStore";
import { navigationRef } from "../navigation/navigationRef";

// 사진 스캔 완료 후 결과 요약 알림. 의심 여행이 있으면 리뷰 화면으로
// 이동하는 액션 버튼도 함께 보여준다.
export function useScanCompletionAlert(pendingInitialScan: boolean) {
  const { t } = useTranslation();
  const lastSync = useVisitStore((s) => s.lastSync);
  const setLastSync = useVisitStore((s) => s.setLastSync);
  const syncStatus = useVisitStore((s) => s.syncStatus);
  const suspectTrips = useVisitStore((s) => s.suspectTrips);

  useEffect(() => {
    if (!lastSync) return;
    if (syncStatus.running) return;
    // 초기 스캔 화면은 결과를 자체 UI로 직접 보여주므로 알림을 띄우지 않는다.
    if (pendingInitialScan) return;
    const { permission, scanned, added, error } = lastSync;

    let title = t("scan.completedTitle");
    let body: string;

    if (error) {
      title = t("scan.errorTitle");
      body = t("scan.errorBody");
    } else if (permission === "denied") {
      title = t("scan.permissionDeniedTitle");
      body = t("scan.permissionDeniedBody");
    } else if (added > 0) {
      body = t("scan.addedBody", {
        scanned: scanned.toLocaleString(),
        added: added.toLocaleString(),
      });
      if (permission === "limited") {
        body += t("scan.limitedSuffixAdded");
      }
    } else if (scanned > 0) {
      body = t("scan.noNewBody");
      if (permission === "limited") {
        body += t("scan.limitedSuffixNoNew");
      }
    } else {
      body =
        permission === "limited"
          ? t("scan.noPhotosLimited")
          : t("scan.noPhotos");
    }

    const suspectCount = suspectTrips.length;
    if (!error && permission !== "denied" && suspectCount > 0) {
      body += t("scan.suspectFound", { count: suspectCount });
    }

    const buttons: {
      text: string;
      style?: "default" | "cancel" | "destructive";
      onPress: () => void;
    }[] = [{ text: t("common.ok"), onPress: () => setLastSync(null) }];
    if (!error && permission !== "denied" && suspectCount > 0) {
      buttons.unshift({
        text: t("scan.reviewAction"),
        onPress: () => {
          setLastSync(null);
          if (navigationRef.isReady()) {
            navigationRef.navigate("ReviewSuspect");
          }
        },
      });
    }

    Alert.alert(title, body, buttons);
  }, [
    lastSync,
    syncStatus.running,
    setLastSync,
    suspectTrips,
    pendingInitialScan,
    t,
  ]);
}
