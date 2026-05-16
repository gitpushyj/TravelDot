import React from "react";
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Briefcase, Calendar, Image as ImageIcon } from "lucide-react-native";

import CountryDotMap from "../../components/CountryDotMap";
import { colorForCountry } from "../../utils/countryColors";

import { HERO_DOT_COLOR, heroStyles } from "./HeroCard.styles";

type Props = {
  code: string;
  name: string;
  visits: number;
  days: number;
  photos: number;
};

export default function HeroCard({ code, name, visits, days, photos }: Props) {
  const { t } = useTranslation();
  const bg = colorForCountry(code).bg;

  return (
    <View style={[heroStyles.card, { backgroundColor: bg }]}>
      <View style={heroStyles.topRow}>
        <View style={heroStyles.textArea}>
          <Text style={heroStyles.name} numberOfLines={2}>
            {name}
          </Text>
          <Text style={heroStyles.code}>{code}</Text>
        </View>
        <View style={heroStyles.dotArea}>
          <CountryDotMap countryCode={code} color={HERO_DOT_COLOR} />
        </View>
      </View>

      <View style={heroStyles.statsRow}>
        <StatCol
          icon={<Briefcase size={22} color="#FFFFFF" strokeWidth={2} />}
          value={visits}
          label={t("countryDetail.statVisits")}
        />
        <View style={heroStyles.statDivider} />
        <StatCol
          icon={<Calendar size={22} color="#FFFFFF" strokeWidth={2} />}
          value={days}
          label={t("countryDetail.statDays")}
        />
        <View style={heroStyles.statDivider} />
        <StatCol
          icon={<ImageIcon size={22} color="#FFFFFF" strokeWidth={2} />}
          value={photos}
          label={t("countryDetail.statPhotos")}
        />
      </View>
    </View>
  );
}

function StatCol({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <View style={heroStyles.statCol}>
      <View style={heroStyles.statIconWrap}>{icon}</View>
      <Text style={heroStyles.statNum}>{value}</Text>
      <Text style={heroStyles.statLabel}>{label}</Text>
    </View>
  );
}
