import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { useScreenBottomInset } from "../hooks/useScreenInsets";
import { getCurrentLocale } from "../i18n";
import { getCountryName } from "../lib/countryName";
import type { ImageDetailPhoto } from "../navigation/types";
import { useTheme } from "../theme/themeStore";
import { colorForCountry } from "../utils/countryColors";
import { flagEmoji } from "../utils/flag";
import { formatTripDateRange } from "../utils/tripFormat";

import {
  formatDateLong,
  formatDateShortDot,
} from "./TripDetailScreen/format";
import PhotosGridView from "./TripDetailScreen/PhotosGridView";
import { makeStyles } from "./TripDetailScreen/styles";

type Props = {
  trip: RecentTrip;
  onClose: () => void;
  onEdit: () => void;
  onSelectCountry: () => void;
  onSelectPhoto: (args: {
    photos: ImageDetailPhoto[];
    initialIndex: number;
    title: string;
    flag: string;
  }) => void;
};

type DisplayPhoto = {
  key: string;
  uri: string;
  date: string;
  fromDb: boolean;
};

const PREVIEW_PHOTO_COUNT = 5;

export default function TripDetailScreen({
  trip,
  onClose,
  onEdit,
  onSelectCountry,
  onSelectPhoto,
}: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const bottomInset = useScreenBottomInset();

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
      // shouldDownloadFromNetwork: true → iCloud에 있고 디바이스 미다운로드된
      // 자산도 받아와 표시한다. savedPhotos는 사용자가 의도적으로 저장한
      // 항목이라 수가 많지 않아 일괄 해석으로도 부담이 적다.
      const resolved = await resolveDisplayUris(
        photos.map((p) => ({ id: p.id, uri: p.localUri })),
        { shouldDownloadFromNetwork: true }
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
  //
  // 표시 단계는 두 단계로 나눈다:
  //   1) 미리보기에 쓰일 첫 PREVIEW_PHOTO_COUNT장만 우선 resolve해서 즉시 setState.
  //      → 첫 진입 지연을 짧게 유지한다.
  //   2) 나머지 사진을 백그라운드로 resolve해서 전체 목록으로 교체.
  //      → grid 진입 시 전체가 보인다.
  //
  // 두 단계 모두 shouldDownloadFromNetwork: true로 호출해 iCloud-only 자산도
  // 받아온다. ph:// 그대로 RN Image에 넘기면 iCloud 미다운로드 자산이 흰 셀로
  // 그려지고 카운트와 실제 보이는 수가 어긋나는데, 이 패턴은 그 회귀를 막으면서
  // 못 가져오는 사진이 없게 한다. 해석 실패한 항목은 savedPhotos와 동일하게
  // 표시 목록에서 제외한다.
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

        const head = photos.slice(0, PREVIEW_PHOTO_COUNT);
        const tail = photos.slice(PREVIEW_PHOTO_COUNT);

        const headResolved = await resolveDisplayUris(
          head.map((p) => ({ id: p.id, uri: p.uri })),
          { shouldDownloadFromNetwork: true }
        );
        if (cancelled) return;
        const headPhotos = head.flatMap((p) => {
          const local = headResolved[p.id];
          if (!local || local.startsWith("ph://")) return [];
          return [{ ...p, uri: local }];
        });
        setDevicePhotos(headPhotos);

        if (tail.length === 0) return;

        const tailResolved = await resolveDisplayUris(
          tail.map((p) => ({ id: p.id, uri: p.uri })),
          { shouldDownloadFromNetwork: true }
        );
        if (cancelled) return;
        const tailPhotos = tail.flatMap((p) => {
          const local = tailResolved[p.id];
          if (!local || local.startsWith("ph://")) return [];
          return [{ ...p, uri: local }];
        });
        setDevicePhotos([...headPhotos, ...tailPhotos]);
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
    const result: {
      key: string;
      uri: string;
      takenAt: number;
      date: string;
    }[] = [];
    const seenIds = new Set<string>();
    if (savedPhotos) {
      for (const p of savedPhotos) {
        if (seenIds.has(p.id)) continue;
        result.push({
          key: `db:${p.id}`,
          uri: p.localUri,
          takenAt: p.takenAt,
          date: p.date,
        });
        seenIds.add(p.id);
      }
    }
    if (devicePhotos) {
      for (const p of devicePhotos) {
        if (seenIds.has(p.id)) continue;
        result.push({
          key: `dev:${p.id}`,
          uri: p.uri,
          takenAt: p.takenAt,
          date: p.date,
        });
        seenIds.add(p.id);
      }
    }
    return result;
  }, [savedPhotos, devicePhotos]);

  const openImageDetail = useCallback(
    (initialIndex: number) => {
      if (allPhotos.length === 0) return;
      const photos: ImageDetailPhoto[] = allPhotos.map((p) => ({
        key: p.key,
        uri: p.uri,
        date: p.date,
      }));
      const safeIndex = Math.max(
        0,
        Math.min(initialIndex, photos.length - 1)
      );
      onSelectPhoto({
        photos,
        initialIndex: safeIndex,
        title: koName,
        flag,
      });
    },
    [allPhotos, koName, flag, onSelectPhoto]
  );

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
        onSelectPhoto={openImageDetail}
      />
    );
  }

  return (
    <View style={[styles.root, { paddingBottom: bottomInset }]}>
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
        <Pressable
          onPress={onSelectCountry}
          style={({ pressed }) => [
            styles.heroCard,
            { backgroundColor: countryColor.bg },
            pressed && { opacity: 0.85 },
          ]}
        >
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
        </Pressable>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t("tripDetail.sectionDates")}</Text>
          <Text style={styles.sectionDate}>
            {formatTripDateRange(trip.startDate, trip.endDate)}{" "}
            {t("common.daysSuffix", { count: trip.days })}
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
              <Pressable
                key={p.key}
                onPress={() => openImageDetail(idx)}
                style={styles.photoCard}
              >
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
              </Pressable>
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
