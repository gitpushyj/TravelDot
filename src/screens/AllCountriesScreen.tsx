import { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import countriesJson from "../../assets/data/countries.json";
import { useVisitStore } from "../features/travel/visitStore";
import { type Theme } from "../theme/theme";
import { useTheme } from "../theme/themeStore";
import { flagEmoji } from "../utils/flag";
import { popularityRank } from "../utils/countryPopularity";
import { isUnMember } from "../utils/unMembers";

type CountryEntry = { code: string; name: string; nameKo: string };
// 메인 화면의 "/193" 표시와 분모를 맞추기 위해 UN 가입국만 다룬다.
const COUNTRIES = (countriesJson as CountryEntry[]).filter((c) =>
  isUnMember(c.code)
);

type FilterKey = "all" | "visited" | "unvisited";
type SortKey = "name" | "popular";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "visited", label: "가본 나라" },
  { key: "unvisited", label: "안 가본 나라" },
];

const SORTS: { key: SortKey; label: string }[] = [
  { key: "name", label: "이름순" },
  { key: "popular", label: "인기순" },
];

type Props = {
  onClose: () => void;
  onSelectCountry: (country: CountryEntry) => void;
};

const NUM_COLUMNS = 4;
const LIST_PADDING_H = 12;
const CELL_GAP = 8;

export default function AllCountriesScreen({
  onClose,
  onSelectCountry,
}: Props) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { width: windowWidth } = useWindowDimensions();
  const cellWidth = useMemo(
    () =>
      Math.floor(
        (windowWidth - LIST_PADDING_H * 2 - CELL_GAP * (NUM_COLUMNS - 1)) /
          NUM_COLUMNS
      ),
    [windowWidth]
  );
  const visitCounts = useVisitStore((s) => s.visitCounts);
  const homeCode = useVisitStore((s) => s.homeCountry?.code ?? null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sort, setSort] = useState<SortKey>("name");

  const isVisited = useMemo(() => {
    return (code: string) =>
      (visitCounts[code] ?? 0) > 0 || code === homeCode;
  }, [visitCounts, homeCode]);

  const data = useMemo(() => {
    const filtered = COUNTRIES.filter((c) => {
      if (filter === "visited") return isVisited(c.code);
      if (filter === "unvisited") return !isVisited(c.code);
      return true;
    });
    const arr = [...filtered];
    if (sort === "name") {
      arr.sort((a, b) => a.nameKo.localeCompare(b.nameKo, "ko"));
    } else {
      arr.sort((a, b) => {
        const ra = popularityRank(a.code);
        const rb = popularityRank(b.code);
        if (ra !== rb) return ra - rb;
        return a.nameKo.localeCompare(b.nameKo, "ko");
      });
    }
    return arr;
  }, [filter, sort, isVisited]);

  const visitedCount = useMemo(
    () => COUNTRIES.filter((c) => isVisited(c.code)).length,
    [isVisited]
  );

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
        <Text style={styles.headerTitle}>모든 나라</Text>
        <View style={styles.iconBtnPlaceholder} />
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => {
          const active = f.key === filter;
          return (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={({ pressed }) => [
                styles.filterChip,
                active && styles.filterChipActive,
                pressed && !active && styles.filterChipPressed,
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  active && styles.filterChipTextActive,
                ]}
              >
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>
          {data.length}개국{" "}
          <Text style={styles.metaTextMuted}>· 가본 {visitedCount}</Text>
        </Text>
        <View style={styles.sortPills}>
          {SORTS.map((s) => {
            const active = s.key === sort;
            return (
              <Pressable
                key={s.key}
                onPress={() => setSort(s.key)}
                style={[
                  styles.sortChip,
                  active && styles.sortChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.sortChipText,
                    active && styles.sortChipTextActive,
                  ]}
                >
                  {s.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <FlatList
        data={data}
        keyExtractor={(c) => c.code}
        numColumns={NUM_COLUMNS}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.gridRow}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>해당하는 나라가 없어요.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const visited = isVisited(item.code);
          const isHome = item.code === homeCode;
          return (
            <Pressable
              onPress={() => onSelectCountry(item)}
              style={({ pressed }) => [
                styles.cell,
                { width: cellWidth },
                pressed && styles.cellPressed,
              ]}
            >
              <Text style={[styles.flag, !visited && styles.flagDim]}>
                {flagEmoji(item.code)}
              </Text>
              <Text
                style={[
                  styles.cellName,
                  !visited && styles.cellNameDim,
                ]}
                numberOfLines={2}
              >
                {item.nameKo}
              </Text>
              {isHome && (
                <View style={styles.homeBadge}>
                  <Text style={styles.homeBadgeText}>본국</Text>
                </View>
              )}
            </Pressable>
          );
        }}
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
    iconBtnPlaceholder: { width: 40, height: 40 },
    iconBtnText: {
      color: theme.textPrimary,
      fontSize: 22,
      fontWeight: "600",
      lineHeight: 24,
    },
    headerTitle: {
      color: theme.textPrimary,
      fontSize: 17,
      fontWeight: "800",
    },
    filterRow: {
      flexDirection: "row",
      gap: 8,
      paddingHorizontal: 20,
      paddingTop: 4,
      paddingBottom: 8,
    },
    filterChip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: theme.tabRowBg,
    },
    filterChipPressed: { opacity: 0.7 },
    filterChipActive: {
      backgroundColor: theme.accent,
    },
    filterChipText: {
      color: theme.textSecondary,
      fontSize: 13,
      fontWeight: "700",
    },
    filterChipTextActive: {
      color: "#ffffff",
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 8,
    },
    metaText: {
      color: theme.textPrimary,
      fontSize: 13,
      fontWeight: "700",
    },
    metaTextMuted: {
      color: theme.textSecondary,
      fontWeight: "600",
    },
    sortPills: {
      flexDirection: "row",
      backgroundColor: theme.tabRowBg,
      borderRadius: 999,
      padding: 3,
      gap: 2,
    },
    sortChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
    },
    sortChipActive: {
      backgroundColor: theme.cardBg,
    },
    sortChipText: {
      color: theme.textSecondary,
      fontSize: 12,
      fontWeight: "700",
    },
    sortChipTextActive: {
      color: theme.textPrimary,
    },
    listContent: {
      paddingHorizontal: LIST_PADDING_H,
      paddingTop: 8,
      paddingBottom: 60,
    },
    gridRow: {
      gap: CELL_GAP,
      justifyContent: "flex-start",
    },
    cell: {
      aspectRatio: 0.85,
      backgroundColor: theme.cardBg,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      borderRadius: 14,
      paddingHorizontal: 6,
      paddingVertical: 10,
      marginBottom: CELL_GAP,
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      position: "relative",
    },
    cellPressed: {
      backgroundColor: theme.rowPressedBg,
    },
    flag: {
      fontSize: 34,
    },
    flagDim: {
      opacity: 0.35,
    },
    cellName: {
      color: theme.textPrimary,
      fontSize: 11,
      fontWeight: "700",
      textAlign: "center",
    },
    cellNameDim: {
      color: theme.textMuted,
      fontWeight: "600",
    },
    homeBadge: {
      position: "absolute",
      top: 6,
      right: 6,
      backgroundColor: theme.accent,
      borderRadius: 999,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    homeBadgeText: {
      color: "#ffffff",
      fontSize: 9,
      fontWeight: "800",
    },
    emptyWrap: {
      paddingHorizontal: 20,
      paddingVertical: 36,
      alignItems: "center",
    },
    emptyText: {
      color: theme.textSecondary,
      fontSize: 13,
      textAlign: "center",
    },
  });
}
