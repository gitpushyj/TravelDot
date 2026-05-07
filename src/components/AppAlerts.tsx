import { useBadgeNotificationAlert } from "../hooks/useBadgeNotificationAlert";
import { useHomeCleanupAlert } from "../hooks/useHomeCleanupAlert";
import { useScanCompletionAlert } from "../hooks/useScanCompletionAlert";

// 내부 훅들이 useTranslation 을 사용하므로 i18n 초기화가 끝난 뒤에만
// 마운트되어야 한다. App.tsx 에서 i18nReady 가 true 인 분기에서 렌더한다.
export default function AppAlerts({
  pendingInitialScan,
}: {
  pendingInitialScan: boolean;
}) {
  useScanCompletionAlert(pendingInitialScan);
  useHomeCleanupAlert();
  useBadgeNotificationAlert();
  return null;
}
