import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import CountryDotMap from "../../components/CountryDotMap";
import type { CountryColor } from "../../utils/countryColors";

import { BagIcon, PhotoFrameIcon } from "./icons";

type Props = {
  countryCode: string;
  countryName: string;
  countryColor: CountryColor;
  days: number;
  photoCount: number | null;
  onPress: () => void;
};

export default function HeroCard({
  countryCode,
  countryName,
  countryColor,
  days,
  photoCount,
  onPress,
}: Props) {
  const { t } = useTranslation();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: countryColor.bg },
        pressed && { opacity: 0.85 },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.nameCol}>
          <Text style={styles.countryName} numberOfLines={2}>
            {countryName}
          </Text>
          <Text style={styles.countryCode}>{countryCode}</Text>
        </View>
        <View style={styles.dotsCol}>
          <CountryDotMap countryCode={countryCode} color={countryColor.dot} />
        </View>
      </View>

      <View style={styles.miniRow}>
        <View style={styles.miniCard}>
          <BagIcon size={18} color={countryColor.bg} />
          <View style={styles.miniText}>
            <View style={styles.miniNumLine}>
              <Text style={styles.miniNum}>{days}</Text>
              <Text style={styles.miniUnit}>{t("tripDetail.miniDayUnit")}</Text>
            </View>
            <Text style={styles.miniLabel}>
              {t("tripDetail.miniDayLabel")}
            </Text>
          </View>
        </View>

        <View style={styles.miniCard}>
          <PhotoFrameIcon size={18} color={countryColor.bg} />
          <View style={styles.miniText}>
            <View style={styles.miniNumLine}>
              <Text style={styles.miniNum}>{photoCount ?? "—"}</Text>
              <Text style={styles.miniUnit}>
                {t("tripDetail.miniPhotoUnit")}
              </Text>
            </View>
            <Text style={styles.miniLabel}>
              {t("tripDetail.miniPhotoLabel")}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    overflow: "hidden",
    aspectRatio: 16 / 17,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  topRow: {
    flex: 1,
    flexDirection: "row",
  },
  nameCol: {
    width: "42%",
    paddingTop: 4,
  },
  countryName: {
    color: "#ffffff",
    fontSize: 40,
    fontWeight: "800",
    letterSpacing: -0.5,
    lineHeight: 44,
  },
  countryCode: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 4,
    letterSpacing: 1,
  },
  dotsCol: {
    flex: 1,
  },
  miniRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  miniCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  miniText: {
    flex: 1,
  },
  miniNumLine: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 3,
  },
  miniNum: {
    color: "#1a1a1a",
    fontSize: 22,
    fontWeight: "800",
  },
  miniUnit: {
    color: "#1a1a1a",
    fontSize: 13,
    fontWeight: "600",
  },
  miniLabel: {
    color: "#8a8a8a",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
});
