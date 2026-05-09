import React, { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import {
  addPhotos,
  createTrip,
  upsertNote,
  VisitPhotoInput,
} from "../../features/travel/visitRepository";
import { useVisitStore } from "../../features/travel/visitStore";
import { useScreenBottomInset } from "../../hooks/useScreenInsets";
import { useTheme } from "../../theme/themeStore";
import { isValidDateKey, toLocalDateKey } from "../../utils/date";

import CountryStep from "./CountryStep";
import NoteStep from "./NoteStep";
import PhotosStep, { type DraftPhoto } from "./PhotosStep";
import StepIndicator from "./StepIndicator";
import { makeStyles } from "./styles";

type Props = { onClose: () => void };

type Selected = { code: string; name: string };

export default function AddTripScreen({ onClose }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const bottomInset = useScreenBottomInset();
  const refreshVisits = useVisitStore((s) => s.refreshVisits);

  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [selected, setSelected] = useState<Selected | null>(null);
  const today = toLocalDateKey(Date.now());
  const [startDate, setStartDate] = useState<string>(today);
  const [endDate, setEndDate] = useState<string>(today);
  const [photos, setPhotos] = useState<DraftPhoto[]>([]);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const labels = [
    t("addTrip.step1Label"),
    t("addTrip.step2Label"),
    t("addTrip.step3Label"),
  ];

  const datesValid =
    isValidDateKey(startDate) &&
    isValidDateKey(endDate) &&
    startDate <= endDate;

  const canAdvance =
    (step === 0 && !!selected) || (step === 1 && datesValid) || step === 2;

  // Step 변경 시 date 범위가 바뀌면 사진 날짜를 새 범위에 맞춰 재계산.
  const onChangeStart = (v: string) => {
    setStartDate(v);
    if (isValidDateKey(v)) {
      setPhotos((prev) =>
        prev.map((p) => {
          const exifDate = toLocalDateKey(p.takenAt);
          const inRange =
            isValidDateKey(endDate) && exifDate >= v && exifDate <= endDate;
          return inRange ? { ...p, date: exifDate } : { ...p, date: v };
        })
      );
    }
  };
  const onChangeEnd = (v: string) => {
    setEndDate(v);
    if (isValidDateKey(v)) {
      setPhotos((prev) =>
        prev.map((p) => {
          const exifDate = toLocalDateKey(p.takenAt);
          const inRange =
            isValidDateKey(startDate) && exifDate >= startDate && exifDate <= v;
          return inRange ? { ...p, date: exifDate } : { ...p, date: startDate };
        })
      );
    }
  };

  const onNext = () => {
    if (!canAdvance) return;
    if (step === 2) {
      void onSubmit();
      return;
    }
    setStep(((step + 1) as 0 | 1 | 2));
  };

  const onBack = () => {
    if (step === 0) {
      onClose();
      return;
    }
    setStep(((step - 1) as 0 | 1 | 2));
  };

  const onSubmit = async () => {
    if (!selected || !datesValid || submitting) return;
    setSubmitting(true);
    try {
      // 1) 범위 전체에 visit_days 보장 — 사진 없는 날도 여행에 포함되도록.
      await createTrip(selected.code, startDate, endDate);

      // 2) 사진 등록.
      if (photos.length > 0) {
        const inputs: VisitPhotoInput[] = photos.map((p) => ({
          id: p.id,
          countryCode: selected.code,
          date: p.date,
          localUri: p.uri,
          source: "manual",
          takenAt: p.takenAt,
        }));
        await addPhotos(inputs);
      }

      // 3) 메모.
      const trimmed = note.trim();
      if (trimmed.length > 0) {
        const noteId = `note-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`;
        await upsertNote({
          id: noteId,
          countryCode: selected.code,
          date: startDate,
          body: trimmed,
        });
      }

      await refreshVisits();
      onClose();
    } catch (e) {
      Alert.alert(t("alerts.registerFailedTitle"), String(e));
      setSubmitting(false);
    }
  };

  const rightLabel = step === 2 ? t("addTrip.saveAction") : t("addTrip.nextAction");

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingBottom: bottomInset }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <View style={styles.headerSide}>
          <Pressable onPress={onBack} hitSlop={8}>
            <Text style={styles.cancel}>
              {step === 0 ? t("common.cancel") : t("common.back")}
            </Text>
          </Pressable>
        </View>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{t("addTrip.heading")}</Text>
          <Text style={styles.headerStep}>
            {t("addTrip.stepCounter", { current: step + 1, total: 3 })}
          </Text>
        </View>
        <View style={[styles.headerSide, { alignItems: "flex-end" }]}>
          {step > 0 && (
            <Pressable
              onPress={onNext}
              hitSlop={8}
              disabled={!canAdvance || submitting}
            >
              <Text
                style={[
                  styles.primaryRight,
                  (!canAdvance || submitting) && styles.primaryRightDisabled,
                ]}
              >
                {submitting ? t("addTrip.submitting") : rightLabel}
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      <StepIndicator styles={styles} current={step} labels={labels} />

      {step === 0 && (
        <CountryStep
          styles={styles}
          theme={theme}
          selectedCode={selected?.code ?? null}
          onSelect={(s) => {
            setSelected(s);
            setStep(1);
          }}
          onClear={() => setSelected(null)}
        />
      )}
      {step === 1 && (
        <PhotosStep
          styles={styles}
          theme={theme}
          startDate={startDate}
          endDate={endDate}
          onChangeStart={onChangeStart}
          onChangeEnd={onChangeEnd}
          photos={photos}
          onChangePhotos={setPhotos}
        />
      )}
      {step === 2 && selected && (
        <NoteStep
          styles={styles}
          theme={theme}
          countryCode={selected.code}
          startDate={startDate}
          endDate={endDate}
          photoCount={photos.length}
          note={note}
          onChangeNote={setNote}
        />
      )}
    </KeyboardAvoidingView>
  );
}
