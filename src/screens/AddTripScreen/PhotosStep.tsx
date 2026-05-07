import * as ImagePicker from "expo-image-picker";
import React from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import type { Theme } from "../../theme/theme";
import { isValidDateKey, toLocalDateKey } from "../../utils/date";
import { dayCount, exifTakenAt } from "./exif";

import type { AddTripStyles } from "./styles";

export type DraftPhoto = {
  id: string;
  uri: string;
  takenAt: number;
  date: string;
};

type Props = {
  styles: AddTripStyles;
  theme: Theme;
  startDate: string;
  endDate: string;
  onChangeStart: (v: string) => void;
  onChangeEnd: (v: string) => void;
  photos: DraftPhoto[];
  onChangePhotos: (photos: DraftPhoto[]) => void;
};

const PRESETS: { key: string; days: number }[] = [
  { key: "preset1", days: 1 },
  { key: "preset2", days: 2 },
  { key: "preset3", days: 3 },
  { key: "preset5", days: 5 },
  { key: "preset7", days: 7 },
];

function shiftEnd(start: string, days: number): string {
  if (!isValidDateKey(start)) return start;
  const [y, m, d] = start.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days - 1));
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export default function PhotosStep({
  styles,
  theme,
  startDate,
  endDate,
  onChangeStart,
  onChangeEnd,
  photos,
  onChangePhotos,
}: Props) {
  const { t } = useTranslation();

  const datesValid =
    isValidDateKey(startDate) &&
    isValidDateKey(endDate) &&
    startDate <= endDate;

  const total = datesValid ? dayCount(startDate, endDate) : 0;

  const onPickPhotos = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        t("alerts.permissionRequired"),
        t("alerts.photoLibraryPermissionBody")
      );
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      exif: true,
      quality: 0.5,
    });
    if (res.canceled) return;

    const existingIds = new Set(photos.map((p) => p.id));
    const next: DraftPhoto[] = [...photos];
    for (const a of res.assets) {
      const id = a.assetId ?? a.uri;
      if (existingIds.has(id)) continue;
      const exif = a.exif as Record<string, unknown> | undefined;
      const takenAt = exifTakenAt(exif, Date.now());
      const exifDate = toLocalDateKey(takenAt);
      // EXIF 날짜가 새 범위 안이면 그대로, 아니면 시작일로 폴백.
      const date =
        datesValid && exifDate >= startDate && exifDate <= endDate
          ? exifDate
          : startDate;
      next.push({ id, uri: a.uri, takenAt, date });
      existingIds.add(id);
    }
    onChangePhotos(next);
  };

  const removePhoto = (id: string) => {
    onChangePhotos(photos.filter((p) => p.id !== id));
  };

  return (
    <ScrollView
      style={styles.body}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.stepHeading}>
        <Text style={styles.stepTitle}>{t("addTrip.step2Title")}</Text>
        <Text style={styles.stepSubtitle}>{t("addTrip.step2Subtitle")}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("addTrip.dateSection")}</Text>
        <View style={styles.dateRow}>
          <View style={styles.dateField}>
            <Text style={styles.dateLabel}>{t("editTrip.dateLabelStart")}</Text>
            <TextInput
              style={styles.dateInput}
              value={startDate}
              onChangeText={onChangeStart}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.textMuted}
              maxLength={10}
              keyboardType="numbers-and-punctuation"
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>
          <Text style={styles.dateSeparator}>—</Text>
          <View style={styles.dateField}>
            <Text style={styles.dateLabel}>{t("editTrip.dateLabelEnd")}</Text>
            <TextInput
              style={styles.dateInput}
              value={endDate}
              onChangeText={onChangeEnd}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.textMuted}
              maxLength={10}
              keyboardType="numbers-and-punctuation"
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={styles.presetRow}>
          {PRESETS.map((p) => {
            const isActive = datesValid && total === p.days;
            return (
              <Pressable
                key={p.key}
                hitSlop={4}
                onPress={() => {
                  if (!isValidDateKey(startDate)) return;
                  onChangeEnd(shiftEnd(startDate, p.days));
                }}
                style={({ pressed }) => [
                  styles.presetBtn,
                  isActive && styles.presetBtnActive,
                  pressed && !isActive && styles.presetBtnPressed,
                ]}
              >
                <Text
                  style={[
                    styles.presetBtnText,
                    isActive && styles.presetBtnTextActive,
                  ]}
                >
                  {t("addTrip.dayPreset", { days: p.days })}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {!datesValid ? (
          <Text style={styles.errorText}>{t("editTrip.dateFormatHelp")}</Text>
        ) : (
          <Text style={styles.helpText}>
            {t("editTrip.totalDays", { days: total })}
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>{t("addTrip.photoSection")}</Text>
          <Pressable
            onPress={onPickPhotos}
            hitSlop={6}
            style={({ pressed }) => [
              styles.addBtn,
              pressed && styles.addBtnPressed,
            ]}
          >
            <Text style={styles.addBtnText}>{t("editTrip.addPhotos")}</Text>
          </Pressable>
        </View>
        {photos.length === 0 ? (
          <View style={styles.photoEmpty}>
            <Text style={styles.photoEmptyTitle}>
              {t("addTrip.photoEmptyTitle")}
            </Text>
            <Text style={styles.photoEmptyHint}>
              {t("addTrip.photoEmptyHint")}
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.helpTextDim}>
              {t("addTrip.photoCount", { count: photos.length })}
            </Text>
            <View style={styles.photoGrid}>
              {photos.map((p) => (
                <View key={p.id} style={styles.photoCell}>
                  <Image source={{ uri: p.uri }} style={styles.photoImage} />
                  <Pressable
                    onPress={() => removePhoto(p.id)}
                    hitSlop={4}
                    style={styles.photoRemoveBtn}
                  >
                    <Text style={styles.photoRemoveText}>×</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}
