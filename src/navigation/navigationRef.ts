import { createNavigationContainerRef } from "@react-navigation/native";

import type { RootStackParamList } from "./types";

// 스캔 완료 알림에서 Stack.Navigator 안의 화면으로 이동시키기 위한 navigation ref.
// 알림 effect가 NavigationContainer 바깥에 있어 hooks로 navigation을 받을 수
// 없으므로 ref로 우회한다.
export const navigationRef = createNavigationContainerRef<RootStackParamList>();
