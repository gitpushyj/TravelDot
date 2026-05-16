import { Image, Pressable, Text, View, type ImageSourcePropType } from "react-native";
import { ChevronRight, type LucideIcon } from "lucide-react-native";

export type GameCardPalette = {
  bg: string;
  accent: string;
  accentText: string;
  separator: string;
  titleText: string;
  statLabel: string;
  statValue: string;
};

export type GameCardStat = {
  icon: LucideIcon;
  label: string;
  value: string;
};

// 게임 허브의 카드 1개. dumb component — 컬러/콘텐츠는 모두 props로 받는다.
export function GameCard({
  palette,
  illustration,
  badgeIcon: BadgeIcon,
  badgeLabel,
  title,
  stats,
  ctaLabel,
  onPress,
}: {
  palette: GameCardPalette;
  illustration: ImageSourcePropType;
  badgeIcon: LucideIcon;
  badgeLabel: string;
  title: string;
  stats: [GameCardStat, GameCardStat, GameCardStat];
  ctaLabel: string;
  onPress: () => void;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        gap: 14,
        padding: 16,
        borderRadius: 24,
        backgroundColor: palette.bg,
      }}
    >
      <Image
        source={illustration}
        style={{ width: 130, height: 180 }}
        resizeMode="contain"
      />
      <View style={{ flex: 1, gap: 10 }}>
        <View style={{ flexDirection: "row" }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 999,
              backgroundColor: palette.accent,
            }}
          >
            <BadgeIcon color={palette.accentText} size={14} />
            <Text
              style={{ color: palette.accentText, fontSize: 13, fontWeight: "700" }}
            >
              {badgeLabel}
            </Text>
          </View>
        </View>
        <Text
          style={{
            fontSize: 20,
            fontWeight: "800",
            color: palette.titleText,
            lineHeight: 26,
          }}
        >
          {title}
        </Text>
        <View
          style={{
            flexDirection: "row",
            paddingVertical: 10,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: palette.separator,
          }}
        >
          {stats.map(({ icon: StatIcon, label, value }, idx) => (
            <View key={idx} style={{ flex: 1, gap: 4 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <StatIcon color={palette.accent} size={14} />
                <Text style={{ fontSize: 11, color: palette.statLabel }}>{label}</Text>
              </View>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: palette.statValue,
                }}
              >
                {value}
              </Text>
            </View>
          ))}
        </View>
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={`${ctaLabel}, ${title.replace(/\n/g, " ")}`}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            paddingVertical: 14,
            borderRadius: 16,
            backgroundColor: palette.accent,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text
            style={{ color: palette.accentText, fontSize: 16, fontWeight: "700" }}
          >
            {ctaLabel}
          </Text>
          <ChevronRight color={palette.accentText} size={18} />
        </Pressable>
      </View>
    </View>
  );
}
