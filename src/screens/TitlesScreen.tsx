import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { localizedCategoryLabel } from "../features/badges/badgeI18n";
import {
  badgeFromId,
  BadgeCategory,
  BadgeDefinition,
  CATEGORY_ORDER,
  getStaticBadgeCatalog,
  sortBadges,
} from "../features/badges/badges";
import { useBadgeStore } from "../features/badges/badgeStore";
import { COUNTRY_NAME_KO_BY_CODE } from "../features/badges/countryNames";
import { getTierByCount } from "../features/travel/tierTitles";
import { useVisitStore } from "../features/travel/visitStore";
import { useScreenBottomInset } from "../hooks/useScreenInsets";
import { useTheme } from "../theme/themeStore";

import BadgeCard from "./TitlesScreen/BadgeCard";
import TitleFilterTabs, {
  TitleFilter,
} from "./TitlesScreen/TitleFilterTabs";
import { makeStyles } from "./TitlesScreen/styles";

type Props = { onClose: () => void; onOpenMilestones: () => void };

export default function TitlesScreen({ onClose, onOpenMilestones }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const bottomInset = useScreenBottomInset();

  const unlocked = useBadgeStore((s) => s.unlocked);
  const activeId = useBadgeStore((s) => s.activeId);
  const setActive = useBadgeStore((s) => s.setActive);
  const visitCounts = useVisitStore((s) => s.visitCounts);

  const [filter, setFilter] = useState<TitleFilter>("all");
  const isUnlockedFilter = filter === "unlocked";

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
      premium_time: [],
      premium_culture: [],
      premium_share: [],
      premium_special: [],
    };
    for (const b of all) groups[b.category].push(b);

    return CATEGORY_ORDER.map((cat) => ({
      category: cat,
      label: localizedCategoryLabel(cat, t),
      // rank 내림차순 — 등급은 위에서부터 명예→T10→T1 순으로 보이도록
      items: sortBadges(groups[cat]),
    }));
  }, [unlocked, t]);

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
    <View style={[styles.root, { paddingBottom: bottomInset }]}>
      <View style={styles.header}>
        <Pressable onPress={onClose} hitSlop={8} style={styles.headerSide}>
          <Text style={styles.cancel}>{t("common.close")}</Text>
        </Pressable>
        <Text style={styles.title}>{t("titles.heading")}</Text>
        <Pressable
          onPress={onOpenMilestones}
          hitSlop={8}
          style={styles.headerSide}
        >
          <Text style={styles.quickLink}>{t("titles.gotoMilestones")} ›</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.autoCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.autoLabel}>{t("titles.autoLabel")}</Text>
            <Text style={styles.autoSub}>{t("titles.autoHint")}</Text>
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
              {isAutoActive ? t("titles.autoActive") : t("titles.autoSet")}
            </Text>
          </Pressable>
        </View>

        <TitleFilterTabs theme={theme} value={filter} onChange={setFilter} />

        {(() => {
          const renderedSections = sections
            .map((section) => {
              const unlockedCount = section.items.filter((b) =>
                unlockedSet.has(b.id)
              ).length;
              const totalCount = section.items.length;

              if (isUnlockedFilter) {
                if (unlockedCount === 0) return null;
                const visibleItems = section.items.filter((b) =>
                  unlockedSet.has(b.id)
                );
                return (
                  <View key={section.category} style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionLabel}>{section.label}</Text>
                      <Text style={styles.sectionCount}>
                        {unlockedCount} / {totalCount}
                      </Text>
                    </View>
                    <View style={styles.grid}>
                      {visibleItems.map((badge) => (
                        <BadgeCard
                          key={badge.id}
                          theme={theme}
                          badge={badge}
                          locked={false}
                          active={effectiveActiveId === badge.id}
                          onPress={() => handlePick(badge.id)}
                        />
                      ))}
                    </View>
                  </View>
                );
              }

              return (
                <View key={section.category} style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionLabel}>{section.label}</Text>
                    <Text style={styles.sectionCount}>
                      {unlockedCount} / {totalCount}
                    </Text>
                  </View>
                  {section.items.length === 0 ? (
                    <Text style={styles.emptyText}>
                      {section.category === "country"
                        ? t("titles.noCountryHint")
                        : t("titles.noneToShow")}
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
            })
            .filter(Boolean);

          if (isUnlockedFilter && renderedSections.length === 0) {
            return (
              <Text style={styles.emptyText}>
                {t("titles.filter.emptyUnlocked")}
              </Text>
            );
          }
          return renderedSections;
        })()}
      </ScrollView>
    </View>
  );
}
