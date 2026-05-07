import React, { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Canvas, RoundedRect } from "@shopify/react-native-skia";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point } from "@turf/helpers";
import type { Feature, MultiPolygon, Polygon } from "geojson";

import countriesData from "../../assets/data/countries-polygons.json";

type CountryFeature = Feature<Polygon | MultiPolygon, { code: string }>;

const FEATURES = (
  countriesData as { features: CountryFeature[] }
).features;

const FILL_RATIO = 0.7;
// 사용자가 요청한 "해상도 1": 1도 격자.
const GRID_SIZE = 1;

type Props = {
  countryCode: string;
  color: string;
};

type DotPoint = { lat: number; lng: number };

const CACHE = new Map<string, DotPoint[]>();

function generateDots(countryCode: string): DotPoint[] {
  const cached = CACHE.get(countryCode);
  if (cached) return cached;
  // 한 나라가 여러 feature(예: 미국 본토/알래스카/하와이/괌)로 분리되어 있을 수 있다.
  const matched = FEATURES.filter((f) => f.properties.code === countryCode);
  if (matched.length === 0) {
    CACHE.set(countryCode, []);
    return [];
  }
  let minLng = 180;
  let maxLng = -180;
  let minLat = 90;
  let maxLat = -90;
  const visit = (ring: number[][]) => {
    for (const [x, y] of ring) {
      if (x < minLng) minLng = x;
      if (x > maxLng) maxLng = x;
      if (y < minLat) minLat = y;
      if (y > maxLat) maxLat = y;
    }
  };
  for (const f of matched) {
    const g = f.geometry;
    if (g.type === "Polygon") {
      for (const r of g.coordinates) visit(r);
    } else {
      for (const poly of g.coordinates) for (const r of poly) visit(r);
    }
  }
  // 격자를 도(°) 단위로 정렬해 화면 정렬을 깔끔하게.
  const startLat = Math.floor(minLat / GRID_SIZE) * GRID_SIZE;
  const startLng = Math.floor(minLng / GRID_SIZE) * GRID_SIZE;
  const dots: DotPoint[] = [];
  for (let lat = startLat; lat <= maxLat; lat += GRID_SIZE) {
    for (let lng = startLng; lng <= maxLng; lng += GRID_SIZE) {
      const cellLat = lat + GRID_SIZE / 2;
      const cellLng = lng + GRID_SIZE / 2;
      const pt = point([cellLng, cellLat]);
      for (const f of matched) {
        if (booleanPointInPolygon(pt, f)) {
          dots.push({ lat: cellLat, lng: cellLng });
          break;
        }
      }
    }
  }
  // 본토에서 동떨어진 영토(예: 미국 알래스카·하와이, 일본 오키나와 남단)가
  // bbox를 과하게 키워 본토 도트가 너무 작아지는 걸 막는다.
  const filtered = removeFarOutliers(dots);
  CACHE.set(countryCode, filtered);
  return filtered;
}

export default function CountryDotMap({ countryCode, color }: Props) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const dots = useMemo(() => generateDots(countryCode), [countryCode]);

  const layout = useMemo(() => {
    if (dots.length === 0 || size.width === 0 || size.height === 0) return null;
    let minLng = Infinity;
    let maxLng = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;
    for (const p of dots) {
      if (p.lng < minLng) minLng = p.lng;
      if (p.lng > maxLng) maxLng = p.lng;
      if (p.lat < minLat) minLat = p.lat;
      if (p.lat > maxLat) maxLat = p.lat;
    }
    const bboxW = maxLng - minLng + GRID_SIZE;
    const bboxH = maxLat - minLat + GRID_SIZE;
    // 컨테이너의 짧은 변 기준 비율 패딩. 카드형 hero(아스펙트 16/11)에서
    // 도트가 둥근 모서리에 닿거나 너무 빠듯해 보이는 걸 막는다.
    const padding = Math.max(
      16,
      Math.min(40, Math.min(size.width, size.height) * 0.1),
    );
    const drawableW = Math.max(1, size.width - padding * 2);
    const drawableH = Math.max(1, size.height - padding * 2);
    const scale = Math.min(drawableW / bboxW, drawableH / bboxH);
    const drawnW = bboxW * scale;
    const drawnH = bboxH * scale;
    const offX = (size.width - drawnW) / 2;
    const offY = (size.height - drawnH) / 2;
    const dotPx = Math.max(2, GRID_SIZE * FILL_RATIO * scale);
    const radius = dotPx * 0.25;
    return { minLng, maxLat, scale, dotPx, radius, offX, offY };
  }, [dots, size]);

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
          {dots.map((p, i) => {
            const x =
              (p.lng - layout.minLng - GRID_SIZE / 2) * layout.scale +
              layout.offX +
              (GRID_SIZE / 2) * layout.scale -
              layout.dotPx / 2;
            const y =
              (layout.maxLat - p.lat - GRID_SIZE / 2) * layout.scale +
              layout.offY +
              (GRID_SIZE / 2) * layout.scale -
              layout.dotPx / 2;
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
