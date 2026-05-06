import React, { useMemo } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

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
import { useVisitStore } from "../features/travel/visitStore";
import { getTierByCount } from "../features/travel/tierTitles";
import { useTheme } from "../theme/themeStore";
import type { Theme } from "../theme/theme";

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

function BadgeCard({
  theme,
  badge,
  locked,
  active,
  onPress,
}: {
  theme: Theme;
  badge: BadgeDefinition;
  locked: boolean;
  active: boolean;
  onPress: () => void;
}) {
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <Pressable
      onPress={onPress}
      disabled={locked}
      style={({ pressed }) => [
        styles.card,
        locked && styles.cardLocked,
        active && !locked && styles.cardActive,
        pressed && !locked && { opacity: 0.75 },
      ]}
    >
      <Text style={[styles.cardEmoji, locked && styles.cardEmojiLocked]}>
        {locked ? "🔒" : badge.emoji}
      </Text>
      <Text
        style={[styles.cardTitle, locked && styles.cardTitleLocked]}
        numberOfLines={2}
      >
        {badge.titleKo}
      </Text>
      <Text
        style={[styles.cardDesc, locked && styles.cardDescLocked]}
        numberOfLines={3}
      >
        {badge.description}
      </Text>
      {active && !locked && (
        <View style={styles.activeMark}>
          <Text style={styles.activeMarkText}>✓</Text>
        </View>
      )}
    </Pressable>
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
    headerSide: { minWidth: 40 },
    title: {
      color: theme.textPrimary,
      fontSize: 17,
      fontWeight: "700",
    },
    cancel: {
      color: theme.accent,
      fontSize: 15,
      fontWeight: "600",
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 40,
    },
    autoCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: theme.cardBg,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginBottom: 20,
    },
    autoLabel: {
      color: theme.textPrimary,
      fontSize: 15,
      fontWeight: "700",
    },
    autoSub: {
      color: theme.textSecondary,
      fontSize: 12,
      marginTop: 2,
      lineHeight: 16,
    },
    autoBtn: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: theme.tabRowBg,
    },
    autoBtnActive: {
      backgroundColor: theme.accent,
    },
    autoBtnText: {
      color: theme.textPrimary,
      fontSize: 12,
      fontWeight: "700",
    },
    autoBtnTextActive: {
      color: theme.radioCheckColor,
    },
    section: {
      marginBottom: 24,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
      marginBottom: 10,
      paddingHorizontal: 4,
    },
    sectionLabel: {
      color: theme.textPrimary,
      fontSize: 15,
      fontWeight: "800",
      letterSpacing: 0.2,
    },
    sectionCount: {
      color: theme.textSecondary,
      fontSize: 12,
      fontWeight: "600",
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    card: {
      width: "48.5%",
      backgroundColor: theme.cardBg,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      padding: 12,
      minHeight: 120,
      gap: 4,
      position: "relative",
    },
    cardLocked: {
      backgroundColor: theme.tabRowBg,
      borderColor: theme.cardBorder,
      opacity: 0.55,
    },
    cardActive: {
      borderColor: theme.accent,
      borderWidth: 2,
      backgroundColor: theme.selectedRowBg,
    },
    cardEmoji: {
      fontSize: 24,
      marginBottom: 2,
    },
    cardEmojiLocked: {
      opacity: 0.6,
    },
    cardTitle: {
      color: theme.textPrimary,
      fontSize: 13,
      fontWeight: "700",
      lineHeight: 17,
    },
    cardTitleLocked: {
      color: theme.textMuted,
    },
    cardDesc: {
      color: theme.textSecondary,
      fontSize: 11,
      lineHeight: 15,
    },
    cardDescLocked: {
      color: theme.textMuted,
    },
    activeMark: {
      position: "absolute",
      top: 8,
      right: 8,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: theme.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    activeMarkText: {
      color: theme.radioCheckColor,
      fontSize: 13,
      fontWeight: "900",
      marginTop: -1,
    },
    emptyText: {
      color: theme.textSecondary,
      fontSize: 12,
      paddingHorizontal: 4,
      paddingVertical: 8,
      lineHeight: 17,
    },
  });
}
