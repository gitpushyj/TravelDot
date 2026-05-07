import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Android edge-to-edge 모드에서 navigation bar 영역을 회피하기 위한 헬퍼.
// app.json의 android.edgeToEdgeEnabled=true 때문에 root 에 paddingBottom 을
// 직접 더해 주지 않으면 ScrollView 마지막 컨텐츠나 absolute footer 가
// navigation bar 와 겹쳐 보인다.
// iOS 는 디자이너가 paddingBottom 을 hard-coded 디자인 값으로 이미 잡아 두어
// home indicator 영역이 자연스럽게 처리되므로, 여기서는 0 을 돌려준다.
// (그렇지 않으면 하단에 두 번 padding 이 들어가 빈 공간이 생긴다.)
export function useScreenBottomInset() {
  const insets = useSafeAreaInsets();
  return Platform.OS === "android" ? insets.bottom : 0;
}
