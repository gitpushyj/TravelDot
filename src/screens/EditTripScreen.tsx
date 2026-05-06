import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { resolveDisplayUris } from "../features/photoSync/photoLibrary";
import {
  addPhotos,
  deleteNote,
  loadLatestNoteForTrip,
  loadPhotosForTrip,
  PHOTO_LIMIT_PER_DAY,
  RecentTrip,
  softDeletePhotosByIds,
  TripPhoto,
  updateTripDates,
  upsertNote,
  VisitNote,
  VisitPhotoInput,
} from "../features/travel/visitRepository";
import { useVisitStore } from "../features/travel/visitStore";
import { isValidDateKey, toLocalDateKey } from "../utils/date";
import { flagEmoji } from "../utils/flag";
import { useTheme } from "../theme/themeStore";
import type { Theme } from "../theme/theme";
import countriesJson from "../../assets/data/countries.json";

type CountryEntry = { code: string; name: string; nameKo: string };
const COUNTRY_LIST = countriesJson as CountryEntry[];
const KO_NAME_BY_CODE: Record<string, string> = {};
for (const c of COUNTRY_LIST) KO_NAME_BY_CODE[c.code] = c.nameKo;

type Props = {
  trip: RecentTrip;
  // changed=true면 저장이 완료된 상태. 호출 측은 trip 파라미터가 stale일 수 있어
  // detail 화면을 건너뛰고 한 단계 더 뒤로 보내고 싶을 때 사용.
  onClose: (changed: boolean) => void;
};

type EditPhoto = {
  id: string;
  date: string;
  uri: string;
  takenAt: number;
  // 'kept' = 기존 DB 사진, 'added' = 새로 선택한 사진, 'removed' = 기존 사진을 삭제 표시
  state: "kept" | "added" | "removed";
};

function exifTakenAt(
  exif: Record<string, unknown> | undefined,
  fallback: number
): number {
  if (!exif) return fallback;
  const raw =
    (exif.DateTimeOriginal as string | undefined) ||
    (exif.DateTimeDigitized as string | undefined) ||
    (exif.DateTime as string | undefined);
  if (!raw) return fallback;
  const m = raw.match(/^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})$/);
  if (!m) return fallback;
  const [, y, mo, d, hh, mm, ss] = m;
  const ms = new Date(
    Number(y),
    Number(mo) - 1,
    Number(d),
    Number(hh),
    Number(mm),
    Number(ss)
  ).getTime();
  return Number.isFinite(ms) ? ms : fallback;
}

export default function EditTripScreen({ trip, onClose }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const refreshVisits = useVisitStore((s) => s.refreshVisits);

  const [loaded, setLoaded] = useState(false);
  const [startDate, setStartDate] = useState(trip.startDate);
  const [endDate, setEndDate] = useState(trip.endDate);
  const [noteBody, setNoteBody] = useState("");
  const [originalNote, setOriginalNote] = useState<VisitNote | null>(null);
  const [photos, setPhotos] = useState<EditPhoto[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [dbPhotos, latest] = await Promise.all([
        loadPhotosForTrip(trip.countryCode, trip.startDate, trip.endDate),
        loadLatestNoteForTrip(trip.countryCode, trip.startDate, trip.endDate),
      ]);
      if (cancelled) return;
      // ph:// → file:// 변환 (없는 자산은 그대로 두면 그리드에서 빈 이미지가 됨).
      const resolved = await resolveDisplayUris(
        dbPhotos.map((p) => ({ id: p.id, uri: p.localUri }))
      );
      if (cancelled) return;
      setPhotos(
        dbPhotos.map<EditPhoto>((p: TripPhoto) => ({
          id: p.id,
          date: p.date,
          uri: resolved[p.id] ?? p.localUri,
          takenAt: p.takenAt,
          state: "kept",
        }))
      );
      setOriginalNote(latest);
      setNoteBody(latest?.body ?? "");
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [trip.countryCode, trip.startDate, trip.endDate]);

  const koName = KO_NAME_BY_CODE[trip.countryCode] ?? trip.countryCode;
  const flag = flagEmoji(trip.countryCode);

  const datesValid =
    isValidDateKey(startDate) &&
    isValidDateKey(endDate) &&
    startDate <= endDate;

  const datesChanged =
    startDate !== trip.startDate || endDate !== trip.endDate;

  const noteChanged = (originalNote?.body ?? "") !== noteBody.trim();

  const photosChanged = photos.some(
    (p) => p.state === "added" || p.state === "removed"
  );

  const dirty = datesChanged || noteChanged || photosChanged;

  const togglePhotoRemoval = (id: string) => {
    setPhotos((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        if (p.state === "kept") return { ...p, state: "removed" };
        if (p.state === "removed") return { ...p, state: "kept" };
        return p; // 'added'는 별도 cancel 버튼으로 제거
      })
    );
  };

  const cancelAddedPhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => !(p.id === id && p.state === "added")));
  };

  const onAddPhotos = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("권한 필요", "사진 라이브러리 권한이 필요합니다.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      exif: true,
      quality: 0.5,
    });
    if (res.canceled) return;

    setPhotos((prev) => {
      const next = [...prev];
      const existingIds = new Set(prev.map((p) => p.id));
      for (const a of res.assets) {
        const id = a.assetId ?? a.uri;
        if (existingIds.has(id)) continue;
        const exif = a.exif as Record<string, unknown> | undefined;
        const takenAt = exifTakenAt(exif, Date.now());
        const exifDate = toLocalDateKey(takenAt);
        // EXIF 날짜가 새 범위 밖이거나 EXIF가 없으면 startDate로 폴백.
        const date =
          exifDate >= startDate && exifDate <= endDate
            ? exifDate
            : startDate;
        next.push({
          id,
          date,
          uri: a.uri,
          takenAt,
          state: "added",
        });
        existingIds.add(id);
      }
      return next;
    });
  };

  const onSave = async () => {
    if (!dirty || submitting) return;
    if (!datesValid) {
      Alert.alert(
        "날짜 확인",
        "날짜는 YYYY-MM-DD 형식이어야 하고 시작일이 종료일보다 늦을 수 없어요."
      );
      return;
    }

    // 새 범위 밖에 있는 기존 사진/메모는 날짜 갱신 시 함께 soft-delete된다.
    const willTrimOldRange =
      datesChanged &&
      (startDate > trip.startDate || endDate < trip.endDate);
    if (willTrimOldRange) {
      const ok = await new Promise<boolean>((resolve) => {
        Alert.alert(
          "기간 변경 확인",
          "새 기간 밖에 있는 사진과 메모는 함께 삭제됩니다. 계속할까요?",
          [
            { text: "취소", style: "cancel", onPress: () => resolve(false) },
            { text: "계속", style: "destructive", onPress: () => resolve(true) },
          ]
        );
      });
      if (!ok) return;
    }

    setSubmitting(true);
    try {
      // 1) 날짜 변경 — 새 범위 밖 visit_days/photos/notes 정리 + 새 범위에 visit_days 보장.
      if (datesChanged) {
        await updateTripDates(
          trip.countryCode,
          trip.startDate,
          trip.endDate,
          startDate,
          endDate
        );
      }

      // 2) 사용자가 명시적으로 제거 표시한 기존 사진 soft-delete.
      const removedIds = photos
        .filter((p) => p.state === "removed")
        .map((p) => p.id);
      if (removedIds.length > 0) {
        await softDeletePhotosByIds(removedIds);
      }

      // 3) 새로 추가된 사진 insert (PHOTO_LIMIT_PER_DAY는 addPhotos에서 enforce).
      const addedPhotos = photos.filter((p) => p.state === "added");
      let dropped = 0;
      if (addedPhotos.length > 0) {
        const inputs: VisitPhotoInput[] = addedPhotos.map((p) => ({
          id: p.id,
          countryCode: trip.countryCode,
          // 새 날짜 범위가 적용된 후에만 추가하므로 그대로 사용.
          date: p.date,
          localUri: p.uri,
          source: "manual",
          takenAt: p.takenAt,
        }));
        const inserted = await addPhotos(inputs);
        dropped = addedPhotos.length - inserted;
      }

      // 4) 메모 갱신 — 비우면 기존 메모 삭제, 채우면 upsert.
      const trimmed = noteBody.trim();
      if (trimmed.length === 0 && originalNote) {
        await deleteNote(originalNote.id);
      } else if (trimmed.length > 0 && noteChanged) {
        const noteId = originalNote?.id ?? `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        // 메모 날짜는 새 시작일 기준 (기존 메모가 새 범위 밖이라 soft-delete됐을 수 있음).
        const noteDate =
          originalNote &&
          originalNote.date >= startDate &&
          originalNote.date <= endDate
            ? originalNote.date
            : startDate;
        await upsertNote({
          id: noteId,
          countryCode: trip.countryCode,
          date: noteDate,
          body: trimmed,
        });
      }

      await refreshVisits();
      if (dropped > 0) {
        Alert.alert(
          "일부 사진 미추가",
          `하루에 최대 ${PHOTO_LIMIT_PER_DAY}장까지만 저장되어 ${dropped}장은 추가되지 않았어요.`,
          [{ text: "확인", onPress: () => onClose(true) }]
        );
      } else {
        onClose(true);
      }
    } catch (e) {
      Alert.alert("저장 실패", String(e));
      setSubmitting(false);
    }
  };

  if (!loaded) {
    return (
      <View style={[styles.root, styles.center]}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  const visiblePhotos = photos.filter((p) => p.state !== "removed");
  const removedCount = photos.filter((p) => p.state === "removed").length;
  const addedCount = photos.filter((p) => p.state === "added").length;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <Pressable onPress={() => onClose(false)} hitSlop={8}>
          <Text style={styles.cancel}>취소</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerFlag}>{flag}</Text>
          <Text style={styles.headerTitle}>{koName} 수정</Text>
        </View>
        <Pressable
          onPress={onSave}
          disabled={!dirty || !datesValid || submitting}
          hitSlop={8}
        >
          <Text
            style={[
              styles.confirm,
              (!dirty || !datesValid || submitting) && styles.confirmDisabled,
            ]}
          >
            {submitting ? "저장 중…" : "저장"}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>여행 기간</Text>
          <View style={styles.dateRow}>
            <DateField
              theme={theme}
              label="시작"
              value={startDate}
              onChange={setStartDate}
            />
            <Text style={styles.dateSeparator}>—</Text>
            <DateField
              theme={theme}
              label="종료"
              value={endDate}
              onChange={setEndDate}
            />
          </View>
          {!datesValid && (
            <Text style={styles.errorText}>
              YYYY-MM-DD 형식이어야 하고 시작일 ≤ 종료일이어야 해요.
            </Text>
          )}
          {datesValid && (
            <Text style={styles.helpText}>
              총 {dayCount(startDate, endDate)}일
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>메모</Text>
          <TextInput
            style={styles.noteInput}
            value={noteBody}
            onChangeText={setNoteBody}
            placeholder="이 여행에서 기억하고 싶은 것들…"
            placeholderTextColor={theme.textMuted}
            multiline
            textAlignVertical="top"
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>사진</Text>
            <Pressable
              onPress={onAddPhotos}
              hitSlop={6}
              style={({ pressed }) => [
                styles.addBtn,
                pressed && styles.addBtnPressed,
              ]}
            >
              <Text style={styles.addBtnText}>+ 추가</Text>
            </Pressable>
          </View>
          {(addedCount > 0 || removedCount > 0) && (
            <Text style={styles.helpText}>
              추가 {addedCount} · 삭제 {removedCount}
            </Text>
          )}
          {visiblePhotos.length === 0 ? (
            <View style={styles.photoEmpty}>
              <Text style={styles.helpText}>저장된 사진이 없어요.</Text>
            </View>
          ) : (
            <View style={styles.photoGrid}>
              {visiblePhotos.map((p) => {
                const isAdded = p.state === "added";
                return (
                  <View key={p.id} style={styles.photoCell}>
                    <Image source={{ uri: p.uri }} style={styles.photoImage} />
                    {isAdded && (
                      <View style={styles.photoBadge}>
                        <Text style={styles.photoBadgeText}>NEW</Text>
                      </View>
                    )}
                    <Pressable
                      onPress={() =>
                        isAdded
                          ? cancelAddedPhoto(p.id)
                          : togglePhotoRemoval(p.id)
                      }
                      hitSlop={4}
                      style={styles.photoRemoveBtn}
                    >
                      <Text style={styles.photoRemoveText}>×</Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          )}
          {removedCount > 0 && (
            <Pressable
              onPress={() =>
                setPhotos((prev) =>
                  prev.map((p) =>
                    p.state === "removed" ? { ...p, state: "kept" } : p
                  )
                )
              }
              hitSlop={6}
              style={({ pressed }) => [
                styles.undoBtn,
                pressed && styles.undoBtnPressed,
              ]}
            >
              <Text style={styles.undoBtnText}>
                삭제 표시 {removedCount}장 되돌리기
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function dayCount(start: string, end: string): number {
  const [sy, sm, sd] = start.split("-").map(Number);
  const [ey, em, ed] = end.split("-").map(Number);
  const a = Date.UTC(sy, sm - 1, sd);
  const b = Date.UTC(ey, em - 1, ed);
  return Math.round((b - a) / 86400000) + 1;
}

function DateField({
  theme,
  label,
  value,
  onChange,
}: {
  theme: Theme;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <View style={styles.dateField}>
      <Text style={styles.dateLabel}>{label}</Text>
      <TextInput
        style={styles.dateInput}
        value={value}
        onChangeText={onChange}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={theme.textMuted}
        maxLength={10}
        keyboardType="numbers-and-punctuation"
        autoCorrect={false}
        autoCapitalize="none"
      />
    </View>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.homeBg,
      paddingTop: 56,
    },
    center: { alignItems: "center", justifyContent: "center" },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    headerCenter: {
      flex: 1,
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "center",
      gap: 6,
    },
    headerFlag: { fontSize: 18 },
    headerTitle: {
      color: theme.textPrimary,
      fontSize: 16,
      fontWeight: "800",
    },
    cancel: {
      color: theme.textSecondary,
      fontSize: 15,
      fontWeight: "600",
      minWidth: 44,
    },
    confirm: {
      color: theme.accent,
      fontSize: 15,
      fontWeight: "800",
      minWidth: 44,
      textAlign: "right",
    },
    confirmDisabled: {
      color: theme.textMuted,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 60,
      gap: 24,
    },
    section: { gap: 10 },
    sectionLabel: {
      color: theme.textSecondary,
      fontSize: 13,
      fontWeight: "700",
      letterSpacing: 0.3,
    },
    sectionHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    dateRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 8,
    },
    dateField: { flex: 1, gap: 4 },
    dateLabel: {
      color: theme.textMuted,
      fontSize: 11,
      fontWeight: "600",
    },
    dateInput: {
      backgroundColor: theme.cardBg,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 12,
      color: theme.textPrimary,
      fontSize: 15,
      fontWeight: "600",
    },
    dateSeparator: {
      color: theme.textMuted,
      fontSize: 18,
      paddingBottom: 12,
    },
    helpText: {
      color: theme.textSecondary,
      fontSize: 12,
    },
    errorText: {
      color: theme.accent,
      fontSize: 12,
      fontWeight: "600",
    },
    noteInput: {
      backgroundColor: theme.cardBg,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: theme.textPrimary,
      fontSize: 14,
      lineHeight: 22,
      minHeight: 120,
    },
    addBtn: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: theme.cardBg,
      borderWidth: 1,
      borderColor: theme.cardBorder,
    },
    addBtnPressed: { backgroundColor: theme.tabRowBg },
    addBtnText: {
      color: theme.textPrimary,
      fontSize: 12,
      fontWeight: "700",
    },
    photoGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    photoCell: {
      width: 96,
      height: 96,
      borderRadius: 8,
      overflow: "hidden",
      backgroundColor: theme.cardBg,
    },
    photoImage: { width: "100%", height: "100%" },
    photoRemoveBtn: {
      position: "absolute",
      top: 4,
      right: 4,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: "rgba(0,0,0,0.65)",
      alignItems: "center",
      justifyContent: "center",
    },
    photoRemoveText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "800",
      lineHeight: 18,
    },
    photoBadge: {
      position: "absolute",
      bottom: 4,
      left: 4,
      backgroundColor: theme.accent,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    photoBadgeText: {
      color: "#fff",
      fontSize: 9,
      fontWeight: "800",
      letterSpacing: 0.5,
    },
    photoEmpty: {
      paddingVertical: 16,
      alignItems: "center",
    },
    undoBtn: {
      alignSelf: "flex-start",
      marginTop: 4,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: theme.tabRowBg,
    },
    undoBtnPressed: { opacity: 0.7 },
    undoBtnText: {
      color: theme.textPrimary,
      fontSize: 12,
      fontWeight: "600",
    },
  });
}
