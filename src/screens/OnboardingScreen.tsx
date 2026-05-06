import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import CountryPicker from "../components/CountryPicker";
import { runFullSync } from "../features/photoSync/syncService";
import { useVisitStore } from "../features/travel/visitStore";
import { BG_COLOR } from "../utils/heatmap";

type Mode = "initial" | "change";

type Props = {
  mode?: Mode;
  onClose?: () => void;
};

export default function OnboardingScreen({ mode = "initial", onClose }: Props) {
  const setHomeCountry = useVisitStore((s) => s.setHomeCountry);
  const changeHomeCountry = useVisitStore((s) => s.changeHomeCountry);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  const onSelect = async (entry: {
    code: string;
    name: string;
    nameKo: string;
  }) => {
    if (submitting) return;
    Keyboard.dismiss();
    setSelectedCode(entry.code);
    setSubmitting(true);
    try {
      if (mode === "change") {
        await changeHomeCountry({ code: entry.code, name: entry.nameKo });
      } else {
        await setHomeCountry({ code: entry.code, name: entry.nameKo });
      }
      // 첫 스캔 / 재스캔은 fire-and-forget. 실패해도 화면 전환을 막지 않는다.
      runFullSync().catch((err) => {
        console.warn("[VisitGrid] sync failed", err);
      });
      onClose?.();
    } catch (e) {
      Alert.alert("저장 실패", String(e));
      setSubmitting(false);
    }
  };

  const isChange = mode === "change";

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        {isChange && onClose && (
          <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
            <Text style={styles.closeText}>닫기</Text>
          </Pressable>
        )}
        <Text style={styles.title}>
          {isChange ? "새 본국을 골라주세요" : "본국을 골라주세요"}
        </Text>
        <Text style={styles.subtitle}>
          {isChange
            ? "선택하면 기존 기록이 모두 정리되고 사진을 다시 스캔합니다."
            : "본국 도트는 일수와 무관하게 파란색으로 표시됩니다.\n본국 외 나라는 사진이 찍힌 일수만큼 잔디가 짙어집니다."}
        </Text>
      </View>
      <View style={styles.body}>
        <CountryPicker onSelect={onSelect} selectedCode={selectedCode} />
        {submitting && (
          <View style={styles.overlay}>
            <ActivityIndicator color="#fff" />
            <Text style={styles.overlayText}>
              {isChange ? "본국을 바꾸는 중..." : "준비 중..."}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG_COLOR,
    paddingTop: 36,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  closeBtn: {
    alignSelf: "flex-start",
    paddingVertical: 4,
    marginBottom: 8,
  },
  closeText: {
    color: "#9fb1d6",
    fontSize: 15,
    fontWeight: "600",
  },
  title: {
    color: "#e8eefc",
    fontSize: 22,
    fontWeight: "700",
  },
  subtitle: {
    color: "#7d8aa6",
    fontSize: 13,
    marginTop: 6,
    lineHeight: 18,
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(8, 14, 28, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  overlayText: {
    color: "#e8eefc",
    fontSize: 14,
    fontWeight: "600",
  },
});
