import React, { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import Svg, { Circle, Path, Rect } from "react-native-svg";

import { WheelItem } from "../../components/WheelPicker";
import {
  Gender,
  useProfileStore,
} from "../../features/onboarding/profileStore";
import { useTheme } from "../../theme/themeStore";

import BirthDateCard from "./BirthDateCard";
import GenderCard from "./GenderCard";
import { makeOnboardingStyles } from "./styles";

type Props = { onNext: () => void };

const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = 1900;
// 14세 이상 권장: 신규 등록 가능한 최댓값을 올해-14로 둔다.
const MAX_YEAR = CURRENT_YEAR - 14;
// 기본 선택은 1990년으로 둔다 (UX상 흔한 선택).
const DEFAULT_YEAR = 1990;
const DEFAULT_MONTH = 1;
const DEFAULT_DAY = 1;

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function daysInMonth(year: number, month: number): number {
  // month: 1..12
  return new Date(year, month, 0).getDate();
}

export default function BirthGenderStep({ onNext }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => makeOnboardingStyles(theme), [theme]);
  const local = useMemo(() => makeLocalStyles(theme), [theme]);

  const profile = useProfileStore((s) => s.profile);
  const setProfile = useProfileStore((s) => s.setProfile);

  const [year, setYear] = useState<number>(profile?.birthYear ?? DEFAULT_YEAR);
  const [month, setMonth] = useState<number>(
    profile?.birthMonth ?? DEFAULT_MONTH
  );
  const [day, setDay] = useState<number>(profile?.birthDay ?? DEFAULT_DAY);
  const [gender, setGender] = useState<Gender | null>(profile?.gender ?? null);
  const [submitting, setSubmitting] = useState(false);

  const yearItems: WheelItem[] = useMemo(() => {
    const items: WheelItem[] = [];
    for (let y = MAX_YEAR; y >= MIN_YEAR; y -= 1) {
      items.push({ value: String(y), label: String(y) });
    }
    return items;
  }, []);

  const monthItems: WheelItem[] = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        value: String(i + 1),
        label: pad2(i + 1),
      })),
    []
  );

  const dayItems: WheelItem[] = useMemo(() => {
    const max = daysInMonth(year, month);
    return Array.from({ length: max }, (_, i) => ({
      value: String(i + 1),
      label: pad2(i + 1),
    }));
  }, [year, month]);

  // 월/년 변경으로 일 수가 줄어들면 day를 보정한다 (예: 윤년 2/29 → 평년 2/28).
  useEffect(() => {
    const max = daysInMonth(year, month);
    if (day > max) setDay(max);
  }, [year, month, day]);

  const canSubmit = gender !== null && !submitting;

  const onSubmit = async () => {
    if (!canSubmit || gender === null) return;
    setSubmitting(true);
    try {
      await setProfile({
        birthYear: year,
        birthMonth: month,
        birthDay: day,
        gender,
        // 이미 닉네임을 입력한 사용자가 birth/gender를 다시 저장하더라도
        // 닉네임이 지워지지 않도록 기존 값을 유지한다.
        nickname: profile?.nickname ?? null,
      });
      onNext();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={local.body}>
        <View style={local.header}>
          <CalendarBadge color={theme.accent} bgColor={theme.accentSoftBg} />
          <Text style={[styles.title, { marginTop: 16 }]}>
            {t("onboarding.birth.title")}
          </Text>
          <Text style={styles.subtitle}>{t("onboarding.birth.subtitle")}</Text>
        </View>

        <View style={local.cards}>
          <BirthDateCard
            year={year}
            month={month}
            day={day}
            yearItems={yearItems}
            monthItems={monthItems}
            dayItems={dayItems}
            onYearChange={setYear}
            onMonthChange={setMonth}
            onDayChange={setDay}
          />
          <GenderCard value={gender} onChange={setGender} />
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable
          onPress={onSubmit}
          disabled={!canSubmit}
          style={({ pressed }) => [
            styles.primaryBtn,
            pressed && canSubmit && styles.primaryBtnPressed,
            !canSubmit && styles.primaryBtnDisabled,
          ]}
        >
          <Text style={styles.primaryBtnText}>
            {t("onboarding.birth.next")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function CalendarBadge({
  color,
  bgColor,
}: {
  color: string;
  bgColor: string;
}) {
  return (
    <View
      style={{
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: bgColor,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Svg width={26} height={26} viewBox="0 0 24 24">
        <Rect
          x={3}
          y={5}
          width={18}
          height={16}
          rx={3}
          stroke={color}
          strokeWidth={1.8}
          fill="none"
        />
        <Path
          d="M3 9h18"
          stroke={color}
          strokeWidth={1.8}
          strokeLinecap="round"
        />
        <Path
          d="M8 3v4M16 3v4"
          stroke={color}
          strokeWidth={1.8}
          strokeLinecap="round"
        />
        <Circle cx={8} cy={14} r={1.2} fill={color} />
        <Circle cx={12} cy={14} r={1.2} fill={color} />
        <Circle cx={16} cy={14} r={1.2} fill={color} />
      </Svg>
    </View>
  );
}

function makeLocalStyles(_theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    body: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 8,
    },
    header: {
      paddingTop: 8,
      paddingBottom: 20,
    },
    cards: {
      gap: 16,
    },
  });
}
