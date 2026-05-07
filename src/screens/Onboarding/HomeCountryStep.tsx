import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import CountryPicker from "../../components/CountryPicker";
import { useVisitStore } from "../../features/travel/visitStore";
import { useTheme } from "../../theme/themeStore";

import { makeOnboardingStyles } from "./styles";

type Props = { onNext: () => void };

export default function HomeCountryStep({ onNext }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => makeOnboardingStyles(theme), [theme]);

  const setHomeCountry = useVisitStore((s) => s.setHomeCountry);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
      await setHomeCountry({ code: entry.code, name: entry.nameKo });
      onNext();
    } catch (e) {
      setSubmitting(false);
      Alert.alert("저장 실패", String(e));
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.bodyHeader}>
        <Text style={styles.title}>{t("onboarding.home.title")}</Text>
        <Text style={styles.subtitle}>{t("onboarding.home.subtitle")}</Text>
      </View>
      <View style={localStyles.pickerWrap}>
        <CountryPicker onSelect={onSelect} selectedCode={selectedCode} />
        {submitting && (
          <View style={localStyles.overlay}>
            <ActivityIndicator color="#fff" />
          </View>
        )}
      </View>
    </View>
  );
}

const localStyles = StyleSheet.create({
  pickerWrap: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(8, 14, 28, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
});
