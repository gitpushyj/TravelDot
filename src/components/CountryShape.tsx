import React, { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Canvas, RoundedRect } from "@shopify/react-native-skia";

import dotData from "../../assets/data/dots.json";
import type { CountryRef, DotData } from "../types";

const FILL_RATIO = 0.7;

type Props = {
  countryCode: string;
  color: string;
};

// 특정 나라의 도트들만 모아 카드 영역에 비율 유지하며 채워 그린다.
export default function CountryShape({ countryCode, color }: Props) {
  const { dots, gridSize } = dotData as DotData;
  const [size, setSize] = useState({ width: 0, height: 0 });

  const matched = useMemo(() => {
    const all: { lat: number; lng: number }[] = [];
    for (const d of dots) {
      const fallback: CountryRef[] = d.country
        ? [{ code: d.country, name: d.name ?? d.country }]
        : [];
      const countries =
        d.countries && d.countries.length ? d.countries : fallback;
      if (countries.some((c) => c.code === countryCode)) {
        all.push({ lat: d.lat, lng: d.lng });
      }
    }
    return removeFarOutliers(all);
  }, [dots, countryCode]);

  const layout = useMemo(() => {
    if (matched.length === 0 || size.width === 0 || size.height === 0) {
      return null;
    }
    let minLng = Infinity;
    let maxLng = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;
    for (const p of matched) {
      if (p.lng < minLng) minLng = p.lng;
      if (p.lng > maxLng) maxLng = p.lng;
      if (p.lat < minLat) minLat = p.lat;
      if (p.lat > maxLat) maxLat = p.lat;
    }
    const bboxW = maxLng - minLng + gridSize;
    const bboxH = maxLat - minLat + gridSize;
    const PADDING = 4;
    const drawableW = Math.max(1, size.width - PADDING * 2);
    const drawableH = Math.max(1, size.height - PADDING * 2);
    const scale = Math.min(drawableW / bboxW, drawableH / bboxH);
    const drawnW = bboxW * scale;
    const drawnH = bboxH * scale;
    const offX = (size.width - drawnW) / 2;
    const offY = (size.height - drawnH) / 2;
    const dotPx = Math.max(2, gridSize * FILL_RATIO * scale);
    const radius = dotPx * 0.25;
    return { matched, minLng, maxLat, scale, dotPx, radius, offX, offY };
  }, [matched, size, gridSize]);

  return (
    <View
      style={styles.root}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        if (width !== size.width || height !== size.height) {
          setSize({ width, height });
        }
      }}
    >
      {layout && (
        <Canvas style={{ width: size.width, height: size.height }}>
          {layout.matched.map((p, i) => {
            const x =
              (p.lng - layout.minLng) * layout.scale + layout.offX -
              layout.dotPx / 2 +
              (gridSize / 2) * layout.scale;
            const y =
              (layout.maxLat - p.lat) * layout.scale + layout.offY -
              layout.dotPx / 2 +
              (gridSize / 2) * layout.scale;
            return (
              <RoundedRect
                key={i}
                x={x}
                y={y}
                width={layout.dotPx}
                height={layout.dotPx}
                r={layout.radius}
                color={color}
              />
            );
          })}
        </Canvas>
      )}
    </View>
  );
}

// 본토에서 동떨어진 영토(예: 미국의 알래스카·하와이) 때문에 bbox가 과하게
// 늘어나면 본토가 알아볼 수 없을 만큼 작아진다. Tukey의 IQR 규칙으로
// 중심에서 너무 먼 도트를 잘라내 본토 모양에 집중한다.
function removeFarOutliers<T extends { lat: number; lng: number }>(
  points: T[]
): T[] {
  if (points.length < 8) return points;

  const lats = points.map((p) => p.lat).sort((a, b) => a - b);
  const lngs = points.map((p) => p.lng).sort((a, b) => a - b);
  const cLat = lats[Math.floor(lats.length / 2)];
  const cLng = lngs[Math.floor(lngs.length / 2)];

  const dists = points.map((p) => {
    const dx = p.lng - cLng;
    const dy = p.lat - cLat;
    return Math.sqrt(dx * dx + dy * dy);
  });

  const sortedDists = [...dists].sort((a, b) => a - b);
  const q1 = sortedDists[Math.floor(sortedDists.length * 0.25)];
  const q3 = sortedDists[Math.floor(sortedDists.length * 0.75)];
  const iqr = q3 - q1;
  const upper = q3 + 1.5 * iqr;

  const filtered = points.filter((_, i) => dists[i] <= upper);
  // 너무 많이 잘렸으면 안전하게 원본을 유지한다.
  return filtered.length >= Math.max(4, Math.floor(points.length * 0.5))
    ? filtered
    : points;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: "100%",
  },
});
