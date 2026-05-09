import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import CountryDotMap from "../components/CountryDotMap";
import { resolveDisplayUris } from "../features/photoSync/photoLibrary";
import {
  scanDevicePhotosForTrip,
  type DeviceTripPhoto,
} from "../features/photoSync/tripPhotos";
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
import PhotosGridView, {
  type GridPhoto,
} from "./TripDetailScreen/PhotosGridView";
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
  // 디바이스 스캔 결과의 raw 형태(ph:// 그대로). 카운트와 grid에 그대로 사용한다.
  // file:// resolve는 미리보기 head 5장과, grid에서 화면에 들어오는 셀에 한해
  // lazy로 처리한다.
  const [deviceRawPhotos, setDeviceRawPhotos] = useState<
    DeviceTripPhoto[] | null
  >(null);
  // 미리보기 head 5장의 id → file:// 매핑. grid LazyGridImage도 photoLibrary
  // 모듈 캐시를 통해 이 결과를 재사용하므로 grid 진입 시 head는 즉시 표시된다.
  const [headResolved, setHeadResolved] = useState<Record<string, string>>({});
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
  // 과거에는 스캔 직후 전체 사진을 한 번에 resolveDisplayUris로 file://로
  // 변환했는데, 사진이 많고 iCloud-only 자산이 섞이면 동시 호출이 수백 회로
  // 폭발해 미리보기 5장이 보인 뒤에도 화면이 끊겼다. 이제는 두 단계로 나눈다:
  //   1) head PREVIEW_PHOTO_COUNT장만 즉시 resolve(shouldDownloadFromNetwork:
  //      true). 첫 진입 지연을 짧게 유지한다.
  //   2) tail은 미리 resolve하지 않는다. grid 진입 시 화면에 들어오는 셀이
  //      LazyGridImage / useResolvedUri로 자기 셀만 lazy resolve한다.
  //      photoLibrary 모듈 캐시 덕에 head 5장은 grid에서 재호출되지 않는다.
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
        setDeviceRawPhotos(photos);

        const head = photos
          .slice(0, PREVIEW_PHOTO_COUNT)
          .filter((p) => p.uri.startsWith("ph://"));
        if (head.length === 0) return;

        const resolved = await resolveDisplayUris(
          head.map((p) => ({ id: p.id, uri: p.uri })),
          { shouldDownloadFromNetwork: true }
        );
        if (cancelled) return;
        setHeadResolved(resolved);
      } catch {
        if (cancelled) return;
        // 권한 거부 등으로 실패해도 화면 자체는 동작한다.
        setDeviceRawPhotos([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [trip.countryCode, trip.startDate, trip.endDate]);

  const koName = getCountryName(trip.countryCode, getCurrentLocale());
  const flag = flagEmoji(trip.countryCode);
  const countryColor = colorForCountry(trip.countryCode);

  // 미리보기는 head 5장만이라 lazy resolve를 쓰지 않는다 — head resolve가
  // 끝나기 전엔 ph://인 디바이스 사진을 빈 셀로 보여주지 않도록 제외한다
  // (savedPhotos는 첫 effect에서 이미 file://로 resolve되어 있다).
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
    if (deviceRawPhotos && result.length < PREVIEW_PHOTO_COUNT) {
      for (const p of deviceRawPhotos) {
        if (result.length >= PREVIEW_PHOTO_COUNT) break;
        if (seenIds.has(p.id)) continue;
        const display = p.uri.startsWith("ph://") ? headResolved[p.id] : p.uri;
        if (!display || display.startsWith("ph://")) continue;
        result.push({
          key: `dev:${p.id}`,
          uri: display,
          date: p.date,
          fromDb: false,
        });
        seenIds.add(p.id);
      }
    }
    return result;
  }, [savedPhotos, deviceRawPhotos, headResolved]);

  // 그리드 뷰: DB 저장 사진을 앞쪽에 두고, 디바이스 사진은 그 뒤에 takenAt DESC로
  // 이어 붙인다. 같은 자산은 asset id로 중복 제거. 디바이스 사진의 uri는 ph://
  // 그대로 둔다 — grid 셀이 화면에 들어올 때 LazyGridImage가 lazy resolve한다.
  const allPhotos = useMemo<GridPhoto[]>(() => {
    const result: GridPhoto[] = [];
    const seenIds = new Set<string>();
    if (savedPhotos) {
      for (const p of savedPhotos) {
        if (seenIds.has(p.id)) continue;
        result.push({
          key: `db:${p.id}`,
          id: p.id,
          uri: p.localUri,
          takenAt: p.takenAt,
          date: p.date,
        });
        seenIds.add(p.id);
      }
    }
    if (deviceRawPhotos) {
      for (const p of deviceRawPhotos) {
        if (seenIds.has(p.id)) continue;
        const resolved = headResolved[p.id];
        result.push({
          key: `dev:${p.id}`,
          id: p.id,
          uri: resolved ?? p.uri,
          takenAt: p.takenAt,
          date: p.date,
        });
        seenIds.add(p.id);
      }
    }
    return result;
  }, [savedPhotos, deviceRawPhotos, headResolved]);

  const openImageDetail = useCallback(
    (initialIndex: number) => {
      if (allPhotos.length === 0) return;
      const photos: ImageDetailPhoto[] = allPhotos.map((p) => ({
        key: p.key,
        id: p.id,
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

  // hero 배지·"전체보기 (N)"는 디바이스 스캔이 끝나는 즉시 raw 길이 기준으로
  // 표시한다. resolve를 기다리지 않아 첫 진입 후 "—"가 깜빡이는 시간이 짧다.
  // 삭제된 자산이 카운트에 포함될 수 있는 미세한 부정확성은 화면이 안 끊기는
  // 이득에 비해 무시할 만하다.
  const totalPhotos = useMemo(() => {
    if (savedPhotos == null || deviceRawPhotos == null) return null;
    const ids = new Set<string>();
    for (const p of savedPhotos) ids.add(p.id);
    for (const p of deviceRawPhotos) ids.add(p.id);
    return ids.size;
  }, [savedPhotos, deviceRawPhotos]);

  if (view === "all") {
    return (
      <PhotosGridView
        photos={allPhotos}
        loading={deviceRawPhotos == null}
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
              {/* DB/스캔이 아직 끝나지 않았거나, 디바이스에 사진이 있으나 head
                  resolve가 진행 중이면 "로딩". 그 외에만 "비어있음"으로 단정한다. */}
              {savedPhotos == null ||
              deviceRawPhotos == null ||
              (deviceRawPhotos.length > 0 && previewPhotos.length === 0)
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
