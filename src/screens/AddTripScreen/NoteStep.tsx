import React from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";

import { getCurrentLocale } from "../../i18n";
import { getCountryName } from "../../lib/countryName";
import type { Theme } from "../../theme/theme";
import { colorForCountry } from "../../utils/countryColors";
import { flagEmoji } from "../../utils/flag";
import { dayCount } from "./exif";

import type { AddTripStyles } from "./styles";

type Props = {
  styles: AddTripStyles;
  theme: Theme;
  countryCode: string;
  startDate: string;
  endDate: string;
  photoCount: number;
  note: string;
  onChangeNote: (v: string) => void;
};

export default function NoteStep({
  styles,
  theme,
  countryCode,
  startDate,
  endDate,
  photoCount,
  note,
  onChangeNote,
}: Props) {
  const { t } = useTranslation();
  const days = dayCount(startDate, endDate);
  const color = colorForCountry(countryCode);

  return (
    <ScrollView
      style={styles.body}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.stepHeading}>
        <Text style={styles.stepTitle}>{t("addTrip.step3Title")}</Text>
        <Text style={styles.stepSubtitle}>{t("addTrip.step3Subtitle")}</Text>
      </View>

      <View style={[styles.summaryCard, { backgroundColor: color.bg }]}>
        <View style={styles.summaryLine}>
          <Text style={styles.summaryFlag}>{flagEmoji(countryCode)}</Text>
          <Text style={[styles.summaryName, { color: "#fff" }]}>
            {getCountryName(countryCode, getCurrentLocale())}
          </Text>
        </View>
        <Text style={[styles.summaryDates, { color: "rgba(255,255,255,0.85)" }]}>
          {t("addTrip.summaryDates", {
            start: startDate,
            end: endDate,
            days,
          })}
        </Text>
        <Text style={[styles.summaryPhotos, { color: "rgba(255,255,255,0.7)" }]}>
          {t("addTrip.summaryPhotos", { count: photoCount })}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("addTrip.noteSection")}</Text>
        <TextInput
          style={styles.noteInput}
          value={note}
          onChangeText={onChangeNote}
          placeholder={t("editTrip.notePlaceholder")}
          placeholderTextColor={theme.textMuted}
          multiline
          textAlignVertical="top"
        />
        <Text style={styles.helpTextDim}>{t("addTrip.noteOptional")}</Text>
      </View>
    </ScrollView>
  );
}
