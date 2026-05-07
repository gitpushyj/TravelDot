import { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import countriesJson from "../../assets/data/countries.json";
import { useVisitStore } from "../features/travel/visitStore";
import { useTheme } from "../theme/themeStore";
import { popularityRank } from "../utils/countryPopularity";
import { flagEmoji } from "../utils/flag";
import { isUnMember } from "../utils/unMembers";

import {
  CELL_GAP,
  LIST_PADDING_H,
  makeStyles,
  NUM_COLUMNS,
} from "./AllCountriesScreen/styles";

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
