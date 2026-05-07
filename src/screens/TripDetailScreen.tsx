import React, { useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import CountryDotMap from "../components/CountryDotMap";
import { resolveDisplayUris } from "../features/photoSync/photoLibrary";
import { scanDevicePhotosForTrip } from "../features/photoSync/tripPhotos";
import {
  loadLatestNoteForTrip,
  loadPhotosForTrip,
  RecentTrip,
  TripPhoto,
  VisitNote,
} from "../features/travel/visitRepository";
import { getCurrentLocale } from "../i18n";
import { getCountryName } from "../lib/countryName";
import { useTheme } from "../theme/themeStore";
import { colorForCountry } from "../utils/countryColors";
import { flagEmoji } from "../utils/flag";

import {
  formatDateLong,
  formatDateShort,
  formatDateShortDot,
} from "./TripDetailScreen/format";
import PhotosGridView from "./TripDetailScreen/PhotosGridView";
import { makeStyles } from "./TripDetailScreen/styles";

type Props = {
  trip: RecentTrip;
  onClose: () => void;
  onEdit: () => void;
};

type DisplayPhoto = {
  key: string;
  uri: string;
  date: string;
  fromDb: boolean;
};

const PREVIEW_PHOTO_COUNT = 5;

export default function TripDetailScreen({ trip, onClose, onEdit }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [savedPhotos, setSavedPhotos] = useState<TripPhoto[] | null>(null);
  const [devicePhotos, setDevicePhotos] = useState<
    { id: string; uri: string; takenAt: number; date: string }[] | null
  >(null);
  const [note, setNote] = useState<VisitNote | null>(null);
  const [view, setView] = useState<"detail" | "all">("detail");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [photos, latestNote] = await Promise.all([
        loadPhotosForTrip(trip.countryCode, trip.startDate, trip.endDate),
        loadLatestNoteForTrip(
          trip.countryCode,
          trip.startDate,
          trip.endDate
        ),
      ]);
      if (cancelled) return;
      // ph:// URI는 일부 RN Image 로더가 인식하지 못해 화면에서 file:// localUri로 변환.
      // 자산이 디바이스에서 삭제됐다면 resolve가 실패해 ph://가 그대로 남는데
      // 이 경우 화면에 빈 셀로만 그려져 카운트와 실제 보이는 수가 어긋난다.
      // 표시 가능한 자산만 남긴다.
      const resolved = await resolveDisplayUris(
        photos.map((p) => ({ id: p.id, uri: p.localUri }))
      );
      if (cancelled) return;
      setSavedPhotos(
        photos.flatMap((p) => {
          const local = resolved[p.id];
          if (!local || local.startsWith("ph://")) return [];
          return [{ ...p, localUri: local }];
        })
      );
      setNote(latestNote);
    })();
    return () => {
      cancelled = true;
    };
  }, [trip.countryCode, trip.startDate, trip.endDate]);

  // 디바이스 사진첩 스캔은 비교적 무거우니 DB 조회와 병렬로 분리해 띄우고 끝나는
  // 대로 카운트와 폴백 슬라이드를 갱신한다.
  // resolveDisplayUris(MediaLibrary.getAssetInfoAsync 일괄 호출)은 사진이 많을수록
  // 첫 진입 시 큰 지연을 만들어 호출하지 않는다. iOS의 ph:// URI는 Image 컴포넌트가
  // 직접 로드 가능 (photoLibrary.ts iteratePhotos 주석 참고).
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const photos = await scanDevicePhotosForTrip({
          countryCode: trip.countryCode,
          startDate: trip.startDate,
          endDate: trip.endDate,
        });
        if (cancelled) return;
        setDevicePhotos(photos);
      } catch (e) {
        if (cancelled) return;
        // 권한 거부 등으로 실패해도 화면 자체는 동작한다.
        setDevicePhotos([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [trip.countryCode, trip.startDate, trip.endDate]);

  const koName = getCountryName(trip.countryCode, getCurrentLocale());
  const flag = flagEmoji(trip.countryCode);
  const countryColor = colorForCountry(trip.countryCode);

  // 같은 자산이라도 iOS의 getAssetInfoAsync는 호출마다 임시 file:// 경로가
  // 달라질 수 있어 URI 기반 dedupe가 실패한다. MediaLibrary asset id로 dedupe.
  const previewPhotos = useMemo<DisplayPhoto[]>(() => {
    const result: DisplayPhoto[] = [];
    const seenIds = new Set<string>();
    if (savedPhotos) {
      for (const p of savedPhotos) {
        if (result.length >= PREVIEW_PHOTO_COUNT) break;
        if (seenIds.has(p.id)) continue;
        result.push({
          key: `db:${p.id}`,
          uri: p.localUri,
          date: p.date,
          fromDb: true,
        });
        seenIds.add(p.id);
      }
    }
    if (devicePhotos && result.length < PREVIEW_PHOTO_COUNT) {
      for (const p of devicePhotos) {
        if (result.length >= PREVIEW_PHOTO_COUNT) break;
        if (seenIds.has(p.id)) continue;
        result.push({
          key: `dev:${p.id}`,
          uri: p.uri,
          date: p.date,
          fromDb: false,
        });
        seenIds.add(p.id);
      }
    }
    return result;
  }, [savedPhotos, devicePhotos]);

  // 그리드 뷰: DB 저장 사진을 앞쪽에 두고, 디바이스 사진은 그 뒤에 takenAt DESC로
  // 이어 붙인다. 같은 자산은 asset id로 중복 제거.
  const allPhotos = useMemo(() => {
    const result: { key: string; uri: string; takenAt: number }[] = [];
    const seenIds = new Set<string>();
    if (savedPhotos) {
      for (const p of savedPhotos) {
        if (seenIds.has(p.id)) continue;
        result.push({
          key: `db:${p.id}`,
          uri: p.localUri,
          takenAt: p.takenAt,
        });
        seenIds.add(p.id);
      }
    }
    if (devicePhotos) {
      for (const p of devicePhotos) {
        if (seenIds.has(p.id)) continue;
        result.push({ key: `dev:${p.id}`, uri: p.uri, takenAt: p.takenAt });
        seenIds.add(p.id);
      }
    }
    return result;
  }, [savedPhotos, devicePhotos]);

  // hero 배지·"전체보기 (N)" 모두 grid에 실제로 표시되는 사진 수와 동일해야
  // 일관된다. 디바이스 스캔이 아직 진행 중일 땐 null로 두고 "—"로 표시.
  const totalPhotos =
    savedPhotos == null || devicePhotos == null ? null : allPhotos.length;

  if (view === "all") {
    return (
      <PhotosGridView
        photos={allPhotos}
        loading={devicePhotos == null}
        countryName={koName}
        flag={flag}
        styles={styles}
        onBack={() => setView("detail")}
      />
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable
          onPress={onClose}
          hitSlop={8}
          style={({ pressed }) => [
            styles.iconBtn,
            pressed && styles.iconBtnPressed,
          ]}
        >
          <Text style={styles.iconBtnText}>‹</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerFlag}>{flag}</Text>
          <Text style={styles.headerTitle}>{koName}</Text>
          <Text style={styles.headerCode}>{trip.countryCode}</Text>
        </View>
        <Pressable
          onPress={onEdit}
          hitSlop={8}
          style={({ pressed }) => [
            styles.editBtn,
            pressed && styles.editBtnPressed,
          ]}
        >
          <Text style={styles.editBtnText}>{t("tripDetail.edit")}</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.heroCard, { backgroundColor: countryColor.bg }]}>
          <View style={styles.heroDots}>
            <CountryDotMap
              countryCode={trip.countryCode}
              color={countryColor.dot}
            />
          </View>
          <View style={styles.heroBadgeRow}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeNum}>{trip.days}</Text>
              <Text style={styles.heroBadgeUnit}>{t("tripDetail.dayUnit")}</Text>
            </View>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeNum}>
                {totalPhotos ?? "—"}
              </Text>
              <Text style={styles.heroBadgeUnit}>{t("tripDetail.photoUnit")}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t("tripDetail.sectionDates")}</Text>
          <Text style={styles.sectionDate}>
            {formatDateLong(trip.startDate)} — {formatDateShort(trip.endDate)}
          </Text>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>{t("tripDetail.sectionPhotos")}</Text>
          {totalPhotos != null && totalPhotos > 0 && (
            <Pressable onPress={() => setView("all")} hitSlop={8}>
              <Text style={styles.allLink}>
                {t("tripDetail.viewAll", { count: totalPhotos })}
              </Text>
            </Pressable>
          )}
        </View>

        {previewPhotos.length === 0 ? (
          <View style={styles.emptyPhotos}>
            <Text style={styles.emptyText}>
              {savedPhotos == null
                ? t("tripDetail.photosLoading")
                : t("tripDetail.photosEmpty")}
            </Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.photoRow}
          >
            {previewPhotos.map((p, idx) => (
              <View key={p.key} style={styles.photoCard}>
                <Image source={{ uri: p.uri }} style={styles.photoImage} />
                <View style={styles.photoIndex}>
                  <Text style={styles.photoIndexText}>
                    {String(idx + 1).padStart(2, "0")}
                  </Text>
                </View>
                <View style={styles.photoCaption}>
                  <Text style={styles.photoCaptionText} numberOfLines={1}>
                    {formatDateShortDot(p.date)}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        )}

        {note && (
          <View style={styles.noteCard}>
            <View style={styles.noteHeader}>
              <Text style={styles.noteTitle}>{t("tripDetail.noteSection")}</Text>
              <Text style={styles.noteDate}>
                {t("tripDetail.noteWritten", { date: formatDateLong(note.date) })}
              </Text>
            </View>
            <Text style={styles.noteBody}>{note.body}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
