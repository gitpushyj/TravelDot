import { StatusBar } from "expo-status-bar";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import ImageDetailScreen from "../../screens/ImageDetailScreen";
import type { RootStackParamList } from "../types";

export default function ImageDetailScreenNav({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParamList, "ImageDetail">) {
  const { photos, initialIndex, title, flag } = route.params;
  return (
    <>
      <StatusBar style="light" />
      <ImageDetailScreen
        photos={photos}
        initialIndex={initialIndex}
        title={title}
        flag={flag}
        onClose={() => navigation.goBack()}
      />
    </>
  );
}
