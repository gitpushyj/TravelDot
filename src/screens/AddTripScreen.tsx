import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  Text,
  View,
} from "react-native";

import { resolveCountry } from "../features/photoSync/countryResolver";
import {
  addPhotos,
  countPhotosForDay,
  VisitPhotoInput,
} from "../features/travel/visitRepository";
import { useVisitStore } from "../features/travel/visitStore";
import { KO_NAME_BY_CODE } from "../lib/countryLookup";
import { colorForCountry } from "../utils/countryColors";
import { toLocalDateKey } from "../utils/date";

import { exifLatLng, exifTakenAt } from "./AddTripScreen/exif";
import { styles } from "./AddTripScreen/styles";

type Candidate = {
  id: string;
  uri: string;
  lat: number;
  lng: number;
  takenAt: number;
  countryCode: string;
  countryName: string;
  date: string;
};

type Group = {
  key: string;
  countryCode: string;
  date: string;
  countryName: string;
  candidates: Candidate[];
  existing: number; // already-stored photos for this country/date
  selectedIds: Set<string>;
};

type Props = { onClose: () => void };

export default function AddTripScreen({ onClose }: Props) {
  const refreshVisits = useVisitStore((s) => s.refreshVisits);
  const homeCountry = useVisitStore((s) => s.homeCountry);

  const [groups, setGroups] = useState<Group[] | null>(null);
  const [skipped, setSkipped] = useState(0);
  const [picking, setPicking] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void pickPhotos();
  }, []);

  const pickPhotos = async () => {
    setPicking(true);
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("권한 필요", "사진 라이브러리 권한이 필요합니다.");
        onClose();
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        exif: true,
        quality: 0.5,
      });
      if (res.canceled) {
        onClose();
        return;
      }
      let skip = 0;
      const candidates: Candidate[] = [];
      for (const a of res.assets) {
        const exif = a.exif as Record<string, unknown> | undefined;
        const ll = exifLatLng(exif);
        if (!ll) {
          skip += 1;
          continue;
        }
        const code = resolveCountry(ll.lat, ll.lng);
        if (!code) {
          skip += 1;
          continue;
        }
        const takenAt = exifTakenAt(exif, Date.now());
        candidates.push({
          id: a.assetId ?? a.uri,
          uri: a.uri,
          lat: ll.lat,
          lng: ll.lng,
          takenAt,
          countryCode: code,
          countryName: KO_NAME_BY_CODE[code] ?? code,
          date: toLocalDateKey(takenAt),
        });
      }
      setSkipped(skip);

      // Group by (country, date) and load existing photo counts.
      const map = new Map<string, Group>();
      for (const c of candidates) {
        const key = `${c.countryCode}|${c.date}`;
        const g = map.get(key);
        if (g) {
          g.candidates.push(c);
        } else {
          map.set(key, {
            key,
            countryCode: c.countryCode,
            date: c.date,
            countryName: c.countryName,
            candidates: [c],
            existing: 0,
            selectedIds: new Set(),
          });
        }
      }
      const groupList = [...map.values()];
      await Promise.all(
        groupList.map(async (g) => {
          g.existing = await countPhotosForDay(g.countryCode, g.date);
          // Default selection: first N where N = remaining slot.
          const slot = Math.max(0, 3 - g.existing);
          for (const c of g.candidates.slice(0, slot)) {
            g.selectedIds.add(c.id);
          }
        })
      );
      setGroups(groupList);
    } finally {
      setPicking(false);
    }
  };

  const toggleSelection = (groupKey: string, candidateId: string) => {
    setGroups((prev) => {
      if (!prev) return prev;
      return prev.map((g) => {
        if (g.key !== groupKey) return g;
        const slot = Math.max(0, 3 - g.existing);
        const next = new Set(g.selectedIds);
        if (next.has(candidateId)) {
          next.delete(candidateId);
        } else if (next.size < slot) {
          next.add(candidateId);
        }
        return { ...g, selectedIds: next };
      });
    });
  };

  const totalSelected = useMemo(() => {
    if (!groups) return 0;
    return groups.reduce((sum, g) => sum + g.selectedIds.size, 0);
  }, [groups]);

  const onConfirm = async () => {
    if (!groups || submitting) return;
    setSubmitting(true);
    try {
      const inputs: VisitPhotoInput[] = [];
      for (const g of groups) {
        for (const c of g.candidates) {
          if (!g.selectedIds.has(c.id)) continue;
          inputs.push({
            id: c.id,
            countryCode: c.countryCode,
            date: c.date,
            localUri: c.uri,
            source: "manual",
            takenAt: c.takenAt,
          });
        }
      }
      const added = await addPhotos(inputs);
      await refreshVisits();
      Alert.alert("등록 완료", `${added}장 추가되었습니다.`);
      onClose();
    } catch (e) {
      Alert.alert("등록 실패", String(e));
      setSubmitting(false);
    }
  };

  if (picking) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#fff" />
        <Text style={styles.dim}>사진 선택 중…</Text>
      </View>
    );
  }

  if (!groups) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={onClose} hitSlop={8}>
          <Text style={styles.cancel}>취소</Text>
        </Pressable>
        <Text style={styles.title}>여행 추가</Text>
        <Pressable
          onPress={onConfirm}
          disabled={totalSelected === 0 || submitting}
          hitSlop={8}
        >
          <Text
            style={[
              styles.confirm,
              (totalSelected === 0 || submitting) && styles.confirmDisabled,
            ]}
          >
            {submitting ? "저장 중…" : `등록 ${totalSelected}`}
          </Text>
        </Pressable>
      </View>

      {skipped > 0 && (
        <Text style={styles.skipNote}>
          GPS/위치 미상으로 건너뛴 사진 {skipped}장
        </Text>
      )}

      <FlatList
        data={groups}
        keyExtractor={(g) => g.key}
        contentContainerStyle={styles.listContent}
        renderItem={({ item: g }) => {
          const slot = Math.max(0, 3 - g.existing);
          const isHome =
            homeCountry?.code != null && homeCountry.code === g.countryCode;
          return (
            <View style={styles.group}>
              <View style={styles.groupHead}>
                <View style={styles.groupTitleRow}>
                  <View
                    style={[
                      styles.countryDot,
                      { backgroundColor: colorForCountry(g.countryCode).bg },
                    ]}
                  />
                  <Text style={styles.groupTitle}>
                    {g.countryName}
                    {isHome ? " (본국)" : ""}
                  </Text>
                </View>
                <Text style={styles.groupSub}>
                  {g.date} · 기존 {g.existing}/3 · 선택 {g.selectedIds.size}/
                  {slot}
                </Text>
              </View>
              <View style={styles.thumbRow}>
                {g.candidates.map((c) => {
                  const selected = g.selectedIds.has(c.id);
                  const disabled = !selected && g.selectedIds.size >= slot;
                  return (
                    <Pressable
                      key={c.id}
                      onPress={() => toggleSelection(g.key, c.id)}
                      style={[
                        styles.thumbWrap,
                        selected && styles.thumbWrapSelected,
                        disabled && styles.thumbWrapDisabled,
                      ]}
                    >
                      <Image source={{ uri: c.uri }} style={styles.thumb} />
                      {selected && (
                        <View style={styles.checkBadge}>
                          <Text style={styles.checkBadgeText}>✓</Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
              {slot === 0 && (
                <Text style={styles.full}>이 날짜는 이미 3장이 등록됨</Text>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>
            등록 가능한 사진이 없습니다.{skipped > 0 ? " 모두 GPS가 없거나 알 수 없는 위치였어요." : ""}
          </Text>
        }
      />
    </View>
  );
}
