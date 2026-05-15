import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import { useTranslation } from "react-i18next";

import { useAuthStore } from "../auth/authStore";
import { useTheme } from "../../theme/themeStore";
import { flagEmoji } from "../../utils/flag";
import {
  fetchLeaderboard,
  fetchMyRank,
  type LeaderboardEntry,
  type MyRank,
} from "./scoreService";

const LIMIT = 100;

// 이번 주 1 ~ 100위. 본인이 100위 밖이면 하단 sticky 영역에 본인 행을 따로 보여준다.
export function FlagQuizLeaderboardScreen({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const userId = useAuthStore((s) => s.user?.id ?? null);

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<MyRank | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([fetchLeaderboard(LIMIT), userId ? fetchMyRank() : Promise.resolve(null)]).then(
      ([list, me]) => {
        if (cancelled) return;
        setEntries(list);
        setMyRank(me);
        setLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const meInList = entries.some((e) => e.userId === userId);
  const showFloatingMe = !!myRank && !meInList;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.homeBg }} edges={["top", "bottom"]}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 12,
          paddingVertical: 8,
        }}
      >
        <Pressable onPress={onClose} hitSlop={10} style={{ padding: 8 }}>
          <ChevronLeft color={theme.textPrimary} size={26} />
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: "800", color: theme.textPrimary, marginLeft: 4 }}>
          {t("flagQuiz.leaderboardTitle")}
        </Text>
      </View>

      <Text
        style={{
          fontSize: 12,
          color: theme.textSecondary,
          paddingHorizontal: 20,
          paddingBottom: 8,
        }}
      >
        {t("flagQuiz.weeklyResetHint")}
      </Text>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={theme.accent} />
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(e) => e.userId}
          renderItem={({ item }) => (
            <LeaderboardRow entry={item} isMe={item.userId === userId} />
          )}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
          ItemSeparatorComponent={() => (
            <View style={{ height: 1, backgroundColor: theme.cardBorder, marginLeft: 56 }} />
          )}
          ListEmptyComponent={
            <Text style={{ textAlign: "center", color: theme.textSecondary, paddingVertical: 40 }}>
              {t("flagQuiz.noBestScore")}
            </Text>
          }
        />
      )}

      {showFloatingMe && myRank ? (
        <View
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            bottom: 16,
            backgroundColor: theme.cardBg,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: theme.cardBorder,
            shadowColor: "#000",
            shadowOpacity: 0.08,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 12,
            elevation: 4,
          }}
        >
          <FloatingMeRow rank={myRank.rank} bestScore={myRank.bestScore} />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const RANK_BADGE: Record<number, string> = { 1: "👑", 2: "🥈", 3: "🥉" };

function LeaderboardRow({ entry, isMe }: { entry: LeaderboardEntry; isMe: boolean }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const badge = RANK_BADGE[entry.rank];
  const name = entry.nickname ?? t("flagQuiz.anonymousTraveler");
  const flag = entry.homeCountryCode ? flagEmoji(entry.homeCountryCode) : null;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 8,
        paddingVertical: 12,
        gap: 10,
        backgroundColor: isMe ? theme.accentSoftBg : "transparent",
        borderRadius: 12,
      }}
    >
      <View style={{ width: 38, alignItems: "center" }}>
        {badge ? (
          <Text style={{ fontSize: 20 }}>{badge}</Text>
        ) : (
          <Text style={{ fontSize: 14, fontWeight: "800", color: theme.textSecondary }}>
            {entry.rank}
          </Text>
        )}
      </View>
      {flag ? <Text style={{ fontSize: 18 }}>{flag}</Text> : null}
      <Text
        style={{ flex: 1, fontSize: 15, fontWeight: "700", color: theme.textPrimary }}
        numberOfLines={1}
      >
        {name}
        {isMe ? ` ${t("flagQuiz.youSuffix")}` : ""}
      </Text>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 2 }}>
        <Text style={{ fontSize: 16, fontWeight: "800", color: theme.accent }}>
          {entry.bestScore}
        </Text>
        <Text style={{ fontSize: 12, fontWeight: "700", color: theme.accent }}>
          {t("flagQuiz.scoreUnit")}
        </Text>
      </View>
    </View>
  );
}

function FloatingMeRow({ rank, bestScore }: { rank: number; bestScore: number }) {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 10,
      }}
    >
      <Text style={{ fontSize: 13, fontWeight: "700", color: theme.textSecondary }}>
        {t("flagQuiz.myRank")}
      </Text>
      <Text style={{ flex: 1, fontSize: 16, fontWeight: "800", color: theme.textPrimary }}>
        {t("flagQuiz.rankN", { rank })}
      </Text>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 2 }}>
        <Text style={{ fontSize: 18, fontWeight: "800", color: theme.accent }}>{bestScore}</Text>
        <Text style={{ fontSize: 12, fontWeight: "700", color: theme.accent }}>
          {t("flagQuiz.scoreUnit")}
        </Text>
      </View>
    </View>
  );
}
