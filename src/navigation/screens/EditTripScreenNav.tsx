import { StatusBar } from "expo-status-bar";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import EditTripScreen from "../../screens/EditTripScreen";
import { useTheme } from "../../theme/themeStore";
import type { RootStackParamList } from "../types";

export default function EditTripScreenNav({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParamList, "EditTrip">) {
  const theme = useTheme();
  return (
    <>
      <StatusBar style={theme.statusBar} />
      <EditTripScreen
        trip={route.params.trip}
        // 저장/취소 모두 detail 화면으로 돌아간다. 저장 후엔 visit store가
        // refreshVisits로 갱신되어 detail 화면이 자동으로 재진입 시 새 데이터를 본다.
        // 다만 detail 화면이 이미 mount된 상태에서 trip params는 그대로이므로,
        // 날짜가 바뀌었으면 detail이 보여주는 trip이 더 이상 존재하지 않을 수 있다.
        // 이 경우 두 단계 뒤로 돌아가 trip 목록으로 보낸다.
        onClose={(changed) => {
          if (changed) {
            navigation.pop(2);
          } else {
            navigation.goBack();
          }
        }}
      />
    </>
  );
}
