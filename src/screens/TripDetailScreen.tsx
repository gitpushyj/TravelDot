import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import CountryDotMap from "../components/CountryDotMap";
import { scanDevicePhotosForTrip } from "../features/photoSync/tripPhotos";
import {
  loadLatestNoteForTrip,
  loadPhotosForTrip,
  RecentTrip,
  TripPhoto,
  VisitNote,
} from "../features/travel/visitRepository";
import { flagEmoji } from "../utils/flag";
import { colorForCountry } from "../utils/countryColors";
import { useTheme } from "../theme/themeStore";
import type { Theme } from "../theme/theme";
import countriesJson from "../../assets/data/countries.json";

type CountryEntry = { code: string; name: string; nameKo: string };
const COUNTRY_LIST = countriesJson as CountryEntry[];
const KO_NAME_BY_CODE: Record<string, string> = {};
for (const c of COUNTRY_LIST) KO_NAME_BY_CODE[c.code] = c.nameKo;

type Props = {
  trip: RecentTrip;
  onClose: () => void;
};

type DisplayPhoto = {
  key: string;
  uri: string;
  date: string;
  fromDb: boolean;
};

const PREVIEW_PHOTO_COUNT = 5;

export default function TripDetailScreen({ trip, onClose }: Props) {
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
      setSavedPhotos(photos);
      setNote(latestNote);
    })();
    return () => {
      cancelled = true;
    };
  }, [trip.countryCode, trip.startDate, trip.endDate]);

  // 디바이스 사진첩 스캔은 비교적 무거우니 DB 조회와 병렬로 분리해 띄우고 끝나는
  // 대로 카운트와 폴백 슬라이드를 갱신한다.
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

  const koName = KO_NAME_BY_CODE[trip.countryCode] ?? trip.countryCode;
  const flag = flagEmoji(trip.countryCode);
  const countryColor = colorForCountry(trip.countryCode);

  const previewPhotos = useMemo<DisplayPhoto[]>(() => {
    const result: DisplayPhoto[] = [];
    const usedUris = new Set<string>();
    if (savedPhotos) {
      for (const p of savedPhotos) {
        if (result.length >= PREVIEW_PHOTO_COUNT) break;
        result.push({
          key: `db:${p.id}`,
          uri: p.localUri,
          date: p.date,
          fromDb: true,
        });
        usedUris.add(p.localUri);
      }
    }
    if (devicePhotos && result.length < PREVIEW_PHOTO_COUNT) {
      for (const p of devicePhotos) {
        if (result.length >= PREVIEW_PHOTO_COUNT) break;
        if (usedUris.has(p.uri)) continue;
        result.push({
          key: `dev:${p.id}`,
          uri: p.uri,
          date: p.date,
          fromDb: false,
        });
      }
    }
    return result;
  }, [savedPhotos, devicePhotos]);

  const totalDevicePhotos = devicePhotos?.length;

  // 그리드 뷰: DB 저장 사진을 앞쪽에 두고, 디바이스 사진은 그 뒤에 takenAt DESC로
  // 이어 붙인다. 같은 URI는 중복 제거.
  const allPhotos = useMemo(() => {
    const result: { key: string; uri: string; takenAt: number }[] = [];
    const seen = new Set<string>();
    if (savedPhotos) {
      for (const p of savedPhotos) {
        if (seen.has(p.localUri)) continue;
        result.push({
          key: `db:${p.id}`,
          uri: p.localUri,
          takenAt: p.takenAt,
        });
        seen.add(p.localUri);
      }
    }
    if (devicePhotos) {
      for (const p of devicePhotos) {
        if (seen.has(p.uri)) continue;
        result.push({ key: `dev:${p.id}`, uri: p.uri, takenAt: p.takenAt });
        seen.add(p.uri);
      }
    }
    return result;
  }, [savedPhotos, devicePhotos]);

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
          onPress={() =>
            Alert.alert("준비 중", "여행 수정은 곧 추가됩니다.")
          }
          hitSlop={8}
          style={({ pressed }) => [
            styles.editBtn,
            pressed && styles.editBtnPressed,
          ]}
        >
          <Text style={styles.editBtnText}>✎ 수정</Text>
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
              <Text style={styles.heroBadgeUnit}> 일 여행</Text>
            </View>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeNum}>
                {totalDevicePhotos ?? "—"}
              </Text>
              <Text style={styles.heroBadgeUnit}> 장의 사진</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>여행 기간</Text>
          <Text style={styles.sectionDate}>
            {formatDateLong(trip.startDate)} — {formatDateShort(trip.endDate)}
          </Text>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>사진</Text>
          {totalDevicePhotos != null && totalDevicePhotos > 0 && (
            <Pressable onPress={() => setView("all")} hitSlop={8}>
              <Text style={styles.allLink}>
                전체보기 ({totalDevicePhotos}) →
              </Text>
            </Pressable>
          )}
        </View>

        {previewPhotos.length === 0 ? (
          <View style={styles.emptyPhotos}>
            <Text style={styles.emptyText}>
              {savedPhotos == null
                ? "사진을 불러오는 중…"
                : "이 여행에 저장된 사진이 없어요."}
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
              <Text style={styles.noteTitle}>기록</Text>
              <Text style={styles.noteDate}>
                {formatDateLong(note.date)} 작성
              </Text>
            </View>
            <Text style={styles.noteBody}>{note.body}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

type GridPhoto = { key: string; uri: string; takenAt: number };

const GRID_COLS = 3;
const GRID_GAP = 4;
const SCREEN_WIDTH = Dimensions.get("window").width;
const GRID_PADDING = 16;
const GRID_CELL =
  (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS;

function PhotosGridView({
  photos,
  loading,
  countryName,
  flag,
  styles,
  onBack,
}: {
  photos: GridPhoto[];
  loading: boolean;
  countryName: string;
  flag: string;
  styles: ReturnType<typeof makeStyles>;
  onBack: () => void;
}) {
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
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
          <Text style={styles.headerTitle}>{countryName}</Text>
          <Text style={styles.headerCode}>사진 {photos.length}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>
      {photos.length === 0 ? (
        <View style={styles.gridEmpty}>
          <Text style={styles.emptyText}>
            {loading ? "사진을 불러오는 중…" : "이 여행의 사진이 없어요."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={photos}
          keyExtractor={(p) => p.key}
          numColumns={GRID_COLS}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.gridContent}
          // 큰 사진첩에서도 메모리/스크롤 성능을 안정화한다.
          removeClippedSubviews
          windowSize={5}
          initialNumToRender={24}
          maxToRenderPerBatch={24}
          renderItem={({ item }) => (
            <View style={styles.gridCell}>
              <Image source={{ uri: item.uri }} style={styles.gridImage} />
            </View>
          )}
        />
      )}
    </View>
  );
}

function formatDateLong(date: string): string {
  const [y, m, d] = date.split("-");
  return `${y} · ${m} · ${d}`;
}

function formatDateShort(date: string): string {
  const [, m, d] = date.split("-");
  return `${m} · ${d}`;
}

function formatDateShortDot(date: string): string {
  const [, m, d] = date.split("-");
  return `${m}.${d}`;
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.homeBg,
      paddingTop: 56,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    iconBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.cardBg,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      alignItems: "center",
      justifyContent: "center",
    },
    iconBtnPressed: { backgroundColor: theme.tabRowBg },
    iconBtnText: {
      color: theme.textPrimary,
      fontSize: 22,
      fontWeight: "600",
      lineHeight: 24,
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
      fontSize: 17,
      fontWeight: "800",
    },
    headerCode: {
      color: theme.textSecondary,
      fontSize: 12,
      fontWeight: "700",
    },
    editBtn: {
      paddingHorizontal: 12,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.cardBg,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      alignItems: "center",
      justifyContent: "center",
    },
    editBtnPressed: { backgroundColor: theme.tabRowBg },
    editBtnText: {
      color: theme.textPrimary,
      fontSize: 13,
      fontWeight: "700",
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 60,
      gap: 20,
    },
    heroCard: {
      borderRadius: 24,
      overflow: "hidden",
      backgroundColor: theme.accent,
      // 그라데이션 대신 단색 + 카드 위 도트 배치로 충분히 임팩트가 있다.
      aspectRatio: 16 / 11,
      padding: 16,
      justifyContent: "flex-end",
    },
    heroDots: {
      ...StyleSheet.absoluteFillObject,
    },
    heroBadgeRow: {
      flexDirection: "row",
      gap: 8,
    },
    heroBadge: {
      flexDirection: "row",
      alignItems: "baseline",
      backgroundColor: "rgba(255,255,255,0.95)",
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 12,
    },
    heroBadgeNum: {
      color: "#1a1a1a",
      fontSize: 17,
      fontWeight: "800",
    },
    heroBadgeUnit: {
      color: "#1a1a1a",
      fontSize: 13,
      fontWeight: "600",
    },
    section: {
      gap: 6,
    },
    sectionLabel: {
      color: theme.textSecondary,
      fontSize: 13,
      fontWeight: "600",
      letterSpacing: 0.3,
    },
    sectionDate: {
      color: theme.textPrimary,
      fontSize: 22,
      fontWeight: "800",
      letterSpacing: 0.5,
    },
    sectionHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    sectionTitle: {
      color: theme.textPrimary,
      fontSize: 18,
      fontWeight: "800",
    },
    allLink: {
      color: theme.accent,
      fontSize: 13,
      fontWeight: "700",
    },
    photoRow: {
      gap: 12,
      paddingRight: 4,
    },
    photoCard: {
      width: 160,
      aspectRatio: 16 / 22,
      borderRadius: 18,
      overflow: "hidden",
      backgroundColor: theme.cardBg,
    },
    photoImage: {
      ...StyleSheet.absoluteFillObject,
      width: "100%",
      height: "100%",
    },
    photoIndex: {
      position: "absolute",
      top: 10,
      left: 10,
      backgroundColor: "rgba(0,0,0,0.55)",
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    photoIndexText: {
      color: "#fff",
      fontSize: 11,
      fontWeight: "800",
    },
    photoCaption: {
      position: "absolute",
      left: 12,
      bottom: 12,
    },
    photoCaptionText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "700",
      textShadowColor: "rgba(0,0,0,0.45)",
      textShadowRadius: 4,
    },
    emptyPhotos: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      backgroundColor: theme.cardBg,
      paddingVertical: 28,
      alignItems: "center",
    },
    emptyText: {
      color: theme.textSecondary,
      fontSize: 13,
    },
    gridContent: {
      paddingHorizontal: GRID_PADDING,
      paddingTop: 4,
      paddingBottom: 40,
    },
    gridRow: {
      gap: GRID_GAP,
      marginBottom: GRID_GAP,
    },
    gridCell: {
      width: GRID_CELL,
      height: GRID_CELL,
      borderRadius: 6,
      overflow: "hidden",
      backgroundColor: theme.cardBg,
    },
    gridImage: {
      width: "100%",
      height: "100%",
    },
    gridEmpty: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    noteCard: {
      backgroundColor: theme.cardBg,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      padding: 18,
      gap: 12,
    },
    noteHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    noteTitle: {
      color: theme.textPrimary,
      fontSize: 17,
      fontWeight: "800",
    },
    noteDate: {
      color: theme.textSecondary,
      fontSize: 12,
      fontWeight: "600",
    },
    noteBody: {
      color: theme.textPrimary,
      fontSize: 14,
      lineHeight: 22,
    },
  });
}
