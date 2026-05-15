import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useTheme } from "../../../theme/themeStore";
import { flagEmoji } from "../../../utils/flag";
import type { LeaderboardEntry } from "../scoreService";

// 이번 주 1·2·3위. dense_rank로 동점자는 같은 등수.
// 본인이 포함되면 닉네임 옆에 "(나)"를 표기. 행이 비어 있으면 안내 텍스트.
export function TopThreeList({
  entries,
  currentUserId,
}: {
  entries: LeaderboardEntry[];
  currentUserId: string | null;
}) {
  const { t } = useTranslation();
  const theme = useTheme();

  if (entries.length === 0) {
    return (
      <Text style={{ fontSize: 13, color: theme.textSecondary, paddingVertical: 8 }}>
        {t("flagQuiz.noBestScore")}
      </Text>
    );
  }

  return (
    <View style={{ gap: 10 }}>
      {entries.slice(0, 3).map((e) => (
        <TopRow key={e.userId} entry={e} isMe={!!currentUserId && e.userId === currentUserId} />
      ))}
    </View>
  );
}

const RANK_BADGE: Record<number, string> = { 1: "👑", 2: "🥈", 3: "🥉" };

function TopRow({ entry, isMe }: { entry: LeaderboardEntry; isMe: boolean }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const badge = RANK_BADGE[entry.rank] ?? null;
  const name = entry.nickname ?? t("flagQuiz.anonymousTraveler");
  const flag = entry.homeCountryCode ? flagEmoji(entry.homeCountryCode) : null;

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <Text style={{ fontSize: 16, width: 22, textAlign: "center" }}>
        {badge ?? entry.rank}
      </Text>
      <Text style={{ fontSize: 13, fontWeight: "700", color: theme.textSecondary, width: 32 }}>
        {t("flagQuiz.rankN", { rank: entry.rank })}
      </Text>
      {flag ? <Text style={{ fontSize: 16 }}>{flag}</Text> : null}
      <Text
        style={{ flex: 1, fontSize: 14, fontWeight: "700", color: theme.textPrimary }}
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
