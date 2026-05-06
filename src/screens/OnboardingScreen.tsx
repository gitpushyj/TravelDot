import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import CountryPicker from "../components/CountryPicker";
import { runFullSync } from "../features/photoSync/syncService";
import { useVisitStore } from "../features/travel/visitStore";
import { BG_COLOR } from "../utils/heatmap";

export default function OnboardingScreen() {
  const setHomeCountry = useVisitStore((s) => s.setHomeCountry);
  const [selected, setSelected] = useState<{
    code: string;
    name: string;
    nameKo: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onConfirm = async () => {
    if (!selected || submitting) return;
    setSubmitting(true);
    try {
      await setHomeCountry({ code: selected.code, name: selected.nameKo });
      // 첫 스캔은 fire-and-forget. 실패해도 메인 진입을 막지 않는다.
      runFullSync().catch((err) => {
        console.warn("[VisitGrid] initial sync failed", err);
      });
    } catch (e) {
      Alert.alert("저장 실패", String(e));
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>본국을 골라주세요</Text>
        <Text style={styles.subtitle}>
          본국 도트는 일수와 무관하게 파란색으로 표시됩니다.{"\n"}
          본국 외 나라는 사진이 찍힌 일수만큼 잔디가 짙어집니다.
        </Text>
      </View>
      <View style={styles.body}>
        <CountryPicker
          onSelect={setSelected}
          selectedCode={selected?.code ?? null}
        />
      </View>
      <View style={styles.footer}>
        <Pressable
          disabled={!selected || submitting}
          onPress={onConfirm}
          style={({ pressed }) => [
            styles.btn,
            (!selected || submitting) && styles.btnDisabled,
            pressed && styles.btnPressed,
          ]}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>
              {selected ? `${selected.nameKo}로 시작` : "본국을 선택하세요"}
            </Text>
          )}
        </Pressable>
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
  },
  footer: {
    padding: 20,
  },
  btn: {
    backgroundColor: "#2f6fed",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnDisabled: {
    backgroundColor: "#22304d",
  },
  btnPressed: {
    opacity: 0.85,
  },
  btnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});
