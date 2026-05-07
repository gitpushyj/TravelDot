import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import CountryShape from "../../components/CountryShape";
import { useVisitStore } from "../../features/travel/visitStore";
import type { Theme } from "../../theme/theme";
import { colorForCountry, readableTextOn } from "../../utils/countryColors";
import { makeStyles } from "./styles";

type Props = {
  theme: Theme;
  homeCode: string;
  visitCounts: Record<string, number>;
  onPress: () => void;
};

export default function MiniCard({ theme, homeCode, visitCounts, onPress }: Props) {
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const selectedCountry = useVisitStore((s) => s.selectedCountry);
  const code = selectedCountry?.code ?? homeCode;
  const name = selectedCountry?.name ?? "";
  const isHome = code === homeCode;
  const visitDays = visitCounts[code] ?? 0;
  const countryColor = colorForCountry(code);
  const textColor = readableTextOn(countryColor.bg);

  return (
    <Pressable
      onPress={onPress}
      pointerEvents="box-only"
      style={({ pressed }) => [
        styles.miniCard,
        { backgroundColor: countryColor.bg, borderColor: countryColor.bg },
        pressed && { opacity: 0.85 },
      ]}
    >
      {isHome && (
        <View style={styles.miniBadge}>
          <Text style={styles.miniBadgeText}>{t("home.homeBadge")}</Text>
        </View>
      )}
      <View style={styles.miniDotsArea}>
        <CountryShape countryCode={code} color={countryColor.dot} />
      </View>
      <Text style={[styles.miniTitle, { color: textColor }]} numberOfLines={1}>
        {name}
      </Text>
      <Text style={[styles.miniSub, { color: textColor, opacity: 0.85 }]}>
        {isHome ? t("home.isHome") : t("home.visitedDays", { days: visitDays })}
      </Text>
    </Pressable>
  );
}
