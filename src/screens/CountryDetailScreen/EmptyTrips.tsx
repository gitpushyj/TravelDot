import React, { useMemo } from "react";
import { Image, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useTheme } from "../../theme/themeStore";

import { makeEmptyTripsStyles } from "./EmptyTrips.styles";

export default function EmptyTrips() {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => makeEmptyTripsStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <Image
        source={require("../../../assets/empty-trips.png")}
        style={styles.illustration}
        resizeMode="contain"
      />
      <Text style={styles.line}>{t("countryDetail.emptyLine1")}</Text>
      <Text style={styles.line}>{t("countryDetail.emptyLine2")}</Text>
    </View>
  );
}
