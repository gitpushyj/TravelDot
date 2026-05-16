import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { resolveDisplayUris } from "../features/photoSync/photoLibrary";
import {
  scanDevicePhotosForTrip,
  type DeviceTripPhoto,
} from "../features/photoSync/tripPhotos";
import {
  loadDeletedPhotoIdsForTrip,
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

import DateRangeCard from "./TripDetailScreen/DateRangeCard";
import {
  formatDateLong,
  formatDateShortDot,
} from "./TripDetailScreen/format";
import HeroCard from "./TripDetailScreen/HeroCard";
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

  // savedPhotos.localUri는 ph:// 그대로 보관한다. 그리드 LazyGridImage가
  // 화면에 들어오는 셀만 lazy resolve하므로 trip에 사진이 수백 장 있어도
  // 첫 진입 비용이 일정하다.
  const [savedPhotos, setSavedPhotos] = useState<TripPhoto[] | null>(null);
  // 디바이스 스캔 결과의 raw 형태(ph:// 그대로). 카운트와 grid에 그대로 사용한다.
  const [deviceRawPhotos, setDeviceRawPhotos] = useState<
    DeviceTripPhoto[] | null
  >(null);
  // 미리보기 head N장의 id → file:// 매핑. savedPhotos head와 deviceRawPhotos
  // head를 합쳐 채운다. photoLibrary 모듈 캐시를 통해 grid LazyGridImage도
  // 이 결과를 재사용하므로 그리드 진입 시 head 셀은 즉시 표시된다.
  const [headResolved, setHeadResolved] = useState<Record<string, string>>({});
  // 사용자가 EditTrip에서 명시적으로 제거(soft-delete)한 자산 id 집합.
  // 디바이스 스캔(scanDevicePhotosForTrip)은 DB의 deleted_at을 모르고 좌표·시간만으로
  // 같은 사진을 다시 잡아오므로, 이 set으로 표시 단계에서 걸러야 한다.
  const [deletedDeviceIds, setDeletedDeviceIds] = useState<Set<string>>(
    () => new Set()
  );
  const [note, setNote] = useState<VisitNote | null>(null);
  const [view, setView] = useState<"detail" | "all">("detail");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [photos, latestNote, deletedIds] = await Promise.all([
        loadPhotosForTrip(trip.countryCode, trip.startDate, trip.endDate),
        loadLatestNoteForTrip(
          trip.countryCode,
          trip.startDate,
          trip.endDate
        ),
        loadDeletedPhotoIdsForTrip(
          trip.countryCode,
          trip.startDate,
          trip.endDate
        ),
      ]);
      if (cancelled) return;
      setSavedPhotos(photos);
      setNote(latestNote);
      setDeletedDeviceIds(new Set(deletedIds));

      // 미리보기 영역에 즉시 띄울 head만 file://로 풀어둔다. iCloud 미다운로드
      // 자산도 이 단계에서 받아오기 위해 shouldDownloadFromNetwork: true.
      // 나머지는 grid 셀이 화면에 들어올 때 LazyGridImage가 lazy resolve한다.
      const head = photos
        .slice(0, PREVIEW_PHOTO_COUNT)
        .filter((p) => p.localUri.startsWith("ph://"));
      if (head.length === 0) return;
      const resolved = await resolveDisplayUris(
        head.map((p) => ({ id: p.id, uri: p.localUri })),
        { shouldDownloadFromNetwork: true }
      );
      if (cancelled) return;
      setHeadResolved((prev) => ({ ...prev, ...resolved }));
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

  // 사용자가 EditTrip에서 제거한 자산을 디바이스 스캔 결과에서 걸러낸다.
  // deviceRawPhotos는 좌표·시간만으로 사진첩을 재스캔하므로, 이 필터 없이는
  // 제거된 사진이 TripDetail에 계속 다시 등장한다.
  const visibleDevicePhotos = useMemo<DeviceTripPhoto[] | null>(() => {
    if (deviceRawPhotos == null) return null;
    if (deletedDeviceIds.size === 0) return deviceRawPhotos;
    return deviceRawPhotos.filter((p) => !deletedDeviceIds.has(p.id));
  }, [deviceRawPhotos, deletedDeviceIds]);

  // 미리보기는 head N장만이라 lazy resolve를 쓰지 않는다 — head resolve가
  // 끝나기 전엔 ph://인 자산을 빈 셀로 보여주지 않도록 제외한다.
  // savedPhotos·deviceRawPhotos 양쪽 모두 동일한 headResolved를 거친다.
  const previewPhotos = useMemo<DisplayPhoto[]>(() => {
    const result: DisplayPhoto[] = [];
    const seenIds = new Set<string>();
    if (savedPhotos) {
      for (const p of savedPhotos) {
        if (result.length >= PREVIEW_PHOTO_COUNT) break;
        if (seenIds.has(p.id)) continue;
        const display = p.localUri.startsWith("ph://")
          ? headResolved[p.id]
          : p.localUri;
        if (!display || display.startsWith("ph://")) continue;
        result.push({
          key: `db:${p.id}`,
          uri: display,
          date: p.date,
          fromDb: true,
        });
        seenIds.add(p.id);
      }
    }
    if (visibleDevicePhotos && result.length < PREVIEW_PHOTO_COUNT) {
      for (const p of visibleDevicePhotos) {
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
  }, [savedPhotos, visibleDevicePhotos, headResolved]);

  // 그리드 뷰: DB 저장 사진을 앞쪽에 두고, 디바이스 사진은 그 뒤에 takenAt DESC로
  // 이어 붙인다. 같은 자산은 asset id로 중복 제거. ph:// URI는 그대로 둔다 —
  // grid 셀이 화면에 들어올 때 LazyGridImage가 lazy resolve한다. head N장은
  // photoLibrary 모듈 캐시 덕에 즉시 file://로 표시된다.
  const allPhotos = useMemo<GridPhoto[]>(() => {
    const result: GridPhoto[] = [];
    const seenIds = new Set<string>();
    if (savedPhotos) {
      for (const p of savedPhotos) {
        if (seenIds.has(p.id)) continue;
        const resolved = headResolved[p.id];
        result.push({
          key: `db:${p.id}`,
          id: p.id,
          uri: resolved ?? p.localUri,
          takenAt: p.takenAt,
          date: p.date,
        });
        seenIds.add(p.id);
      }
    }
    if (visibleDevicePhotos) {
      for (const p of visibleDevicePhotos) {
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
  }, [savedPhotos, visibleDevicePhotos, headResolved]);

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
    if (savedPhotos == null || visibleDevicePhotos == null) return null;
    const ids = new Set<string>();
    for (const p of savedPhotos) ids.add(p.id);
    for (const p of visibleDevicePhotos) ids.add(p.id);
    return ids.size;
  }, [savedPhotos, visibleDevicePhotos]);

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
          <Text style={styles.headerTitle}>
            {formatTripDateRange(trip.startDate, trip.endDate)}
          </Text>
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
        <HeroCard
          countryCode={trip.countryCode}
          countryName={koName}
          countryColor={countryColor}
          days={trip.days}
          photoCount={totalPhotos}
          onPress={onSelectCountry}
        />

        <DateRangeCard
          startDate={trip.startDate}
          endDate={trip.endDate}
          days={trip.days}
          countryColor={countryColor}
        />

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
