import React, { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import {
  badgeFromId,
  BadgeCategory,
  BadgeDefinition,
  CATEGORY_LABEL,
  CATEGORY_ORDER,
  getStaticBadgeCatalog,
  sortBadges,
} from "../features/badges/badges";
import { useBadgeStore } from "../features/badges/badgeStore";
import { COUNTRY_NAME_KO_BY_CODE } from "../features/badges/countryNames";
import { getTierByCount } from "../features/travel/tierTitles";
import { useVisitStore } from "../features/travel/visitStore";
import { useTheme } from "../theme/themeStore";

import BadgeCard from "./TitlesScreen/BadgeCard";
import { makeStyles } from "./TitlesScreen/styles";

type Props = { onClose: () => void };

export default function TitlesScreen({ onClose }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const unlocked = useBadgeStore((s) => s.unlocked);
  const activeId = useBadgeStore((s) => s.activeId);
  const setActive = useBadgeStore((s) => s.setActive);
  const visitCounts = useVisitStore((s) => s.visitCounts);

  const currentTierBadgeId = useMemo(() => {
    const tier = getTierByCount(Object.keys(visitCounts).length);
    return `tier_${tier.id}`;
  }, [visitCounts]);

  // activeId가 null이면 "자동(현재 등급)" — 화면상으로는 currentTierBadgeId가 선택된 것처럼 보인다.
  const effectiveActiveId = activeId ?? currentTierBadgeId;

  const unlockedSet = useMemo(() => new Set(unlocked), [unlocked]);

  const sections = useMemo(() => {
    const staticBadges = getStaticBadgeCatalog();

    // 동적 국가 단골은 잠금 해제된 인스턴스만 표시
    const countryBadges: BadgeDefinition[] = [];
    for (const id of unlocked) {
      if (id.startsWith("country_")) {
        const def = badgeFromId(id, COUNTRY_NAME_KO_BY_CODE);
        if (def) countryBadges.push(def);
      }
    }

    const all = [...staticBadges, ...countryBadges];
    const groups: Record<BadgeCategory, BadgeDefinition[]> = {
      tier: [],
      days: [],
      continent: [],
      country: [],
      foreign: [],
    };
    for (const b of all) groups[b.category].push(b);

    return CATEGORY_ORDER.map((cat) => ({
      category: cat,
      label: CATEGORY_LABEL[cat],
      // rank 내림차순 — 등급은 위에서부터 명예→T10→T1 순으로 보이도록
      items: sortBadges(groups[cat]),
    }));
  }, [unlocked]);

  const handlePick = (id: string) => {
    // 사용자가 현재 등급 뱃지를 직접 골랐다면 "자동" 모드로 처리해 등급 상승 시 자동 갱신되도록 한다.
    if (id === currentTierBadgeId) {
      void setActive(null);
    } else {
      void setActive(id);
    }
  };

  const isAutoActive = activeId == null;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={onClose} hitSlop={8} style={styles.headerSide}>
          <Text style={styles.cancel}>닫기</Text>
        </Pressable>
        <Text style={styles.title}>호칭</Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.autoCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.autoLabel}>자동 (현재 등급)</Text>
            <Text style={styles.autoSub}>
              여행한 국가가 늘어나면 등급 호칭이 자동으로 갱신됩니다.
            </Text>
          </View>
          <Pressable
            onPress={() => void setActive(null)}
            disabled={isAutoActive}
            style={({ pressed }) => [
              styles.autoBtn,
              isAutoActive && styles.autoBtnActive,
              pressed && !isAutoActive && { opacity: 0.7 },
            ]}
          >
            <Text
              style={[
                styles.autoBtnText,
                isAutoActive && styles.autoBtnTextActive,
              ]}
            >
              {isAutoActive ? "사용 중" : "자동으로"}
            </Text>
          </Pressable>
        </View>

        {sections.map((section) => {
          const unlockedCount = section.items.filter((b) =>
            unlockedSet.has(b.id)
          ).length;
          return (
            <View key={section.category} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>{section.label}</Text>
                <Text style={styles.sectionCount}>
                  {unlockedCount} / {section.items.length}
                </Text>
              </View>
              {section.items.length === 0 ? (
                <Text style={styles.emptyText}>
                  {section.category === "country"
                    ? "한 국가에서 30일 이상 머무르면 단골 호칭이 잠금 해제됩니다."
                    : "표시할 호칭이 없어요."}
                </Text>
              ) : (
                <View style={styles.grid}>
                  {section.items.map((badge) => (
                    <BadgeCard
                      key={badge.id}
                      theme={theme}
                      badge={badge}
                      locked={!unlockedSet.has(badge.id)}
                      active={effectiveActiveId === badge.id}
                      onPress={() => handlePick(badge.id)}
                    />
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
