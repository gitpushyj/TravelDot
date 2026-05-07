import React, { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import WheelPicker, { WheelItem } from "../../components/WheelPicker";
import {
  Gender,
  useProfileStore,
} from "../../features/onboarding/profileStore";
import { useTheme } from "../../theme/themeStore";

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

const GENDERS: Gender[] = ["male", "female", "other", "prefer_not_to_say"];

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
      });
      onNext();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.bodyHeader}>
        <Text style={styles.title}>{t("onboarding.birth.title")}</Text>
        <Text style={styles.subtitle}>{t("onboarding.birth.subtitle")}</Text>
      </View>

      <View style={local.pickerRow}>
        <View style={local.column}>
          <Text style={local.columnLabel}>{t("onboarding.birth.year")}</Text>
          <WheelPicker
            items={yearItems}
            selectedValue={String(year)}
            onChange={(v) => setYear(Number(v))}
          />
        </View>
        <View style={local.column}>
          <Text style={local.columnLabel}>{t("onboarding.birth.month")}</Text>
          <WheelPicker
            items={monthItems}
            selectedValue={String(month)}
            onChange={(v) => setMonth(Number(v))}
          />
        </View>
        <View style={local.column}>
          <Text style={local.columnLabel}>{t("onboarding.birth.day")}</Text>
          <WheelPicker
            items={dayItems}
            selectedValue={String(day)}
            onChange={(v) => setDay(Number(v))}
          />
        </View>
      </View>

      <View style={local.genderWrap}>
        <Text style={local.sectionLabel}>{t("onboarding.gender.title")}</Text>
        <View style={local.genderRow}>
          {GENDERS.map((g) => {
            const selected = gender === g;
            return (
              <Pressable
                key={g}
                onPress={() => setGender(g)}
                style={({ pressed }) => [
                  local.genderBtn,
                  selected && local.genderBtnSelected,
                  pressed && !selected && local.genderBtnPressed,
                ]}
              >
                <Text
                  style={[
                    local.genderBtnText,
                    selected && local.genderBtnTextSelected,
                  ]}
                >
                  {t(`onboarding.gender.options.${g}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={[styles.footer, { marginTop: "auto" }]}>
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

function makeLocalStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    pickerRow: {
      flexDirection: "row",
      paddingHorizontal: 20,
      paddingTop: 20,
      gap: 12,
    },
    column: {
      flex: 1,
    },
    columnLabel: {
      color: theme.textMuted,
      fontSize: 12,
      fontWeight: "700",
      textAlign: "center",
      marginBottom: 6,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    genderWrap: {
      paddingHorizontal: 20,
      paddingTop: 24,
    },
    sectionLabel: {
      color: theme.textPrimary,
      fontSize: 15,
      fontWeight: "700",
      marginBottom: 10,
    },
    genderRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    genderBtn: {
      flexGrow: 1,
      flexBasis: "47%",
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 12,
      backgroundColor: theme.optionBtnBg,
      borderWidth: 1,
      borderColor: theme.optionBtnBorder,
      alignItems: "center",
      justifyContent: "center",
    },
    genderBtnPressed: {
      backgroundColor: theme.optionBtnPressedBg,
    },
    genderBtnSelected: {
      backgroundColor: theme.accentSoftBg,
      borderColor: theme.accent,
    },
    genderBtnText: {
      color: theme.textSecondary,
      fontSize: 14,
      fontWeight: "700",
    },
    genderBtnTextSelected: {
      color: theme.accentSoftText,
    },
  });
}
