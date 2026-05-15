import React, { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Canvas, RoundedRect } from "@shopify/react-native-skia";

import countryDotsData from "../../assets/data/country-dots.json";

// scripts/generateCountryDots.mjs가 빌드 타임에 채워둔 사전 계산 도트.
// 형식: { [code]: [lng, lat, lng, lat, ...] } (1° 격자 + far-outlier 제거 적용 완료)
const COUNTRY_DOTS = countryDotsData as Record<string, number[]>;

const FILL_RATIO = 0.7;
// scripts/generateCountryDots.mjs와 동기화. 좌표 변환만 사용한다.
const GRID_SIZE = 1;

type Props = {
  countryCode: string;
  color: string;
};

type DotPoint = { lat: number; lng: number };

function loadDots(countryCode: string): DotPoint[] {
  const flat = COUNTRY_DOTS[countryCode];
  if (!flat || flat.length === 0) return [];
  const dots: DotPoint[] = new Array(flat.length / 2);
  for (let i = 0; i < dots.length; i++) {
    dots[i] = { lng: flat[i * 2], lat: flat[i * 2 + 1] };
  }
  return dots;
}

export default function CountryDotMap({ countryCode, color }: Props) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const dots = useMemo(() => loadDots(countryCode), [countryCode]);

  const layout = useMemo(() => {
    if (dots.length === 0 || size.width === 0 || size.height === 0) return null;
    let minLng = Infinity;
    let maxLng = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;
    let sumLng = 0;
    let sumLat = 0;
    for (const p of dots) {
      if (p.lng < minLng) minLng = p.lng;
      if (p.lng > maxLng) maxLng = p.lng;
      if (p.lat < minLat) minLat = p.lat;
      if (p.lat > maxLat) maxLat = p.lat;
      sumLng += p.lng;
      sumLat += p.lat;
    }
    const centroidLng = sumLng / dots.length;
    const centroidLat = sumLat / dots.length;
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
    // 도트가 매우 적은 작은 나라는 bbox를 가득 채우면 도트가 너무 커 보이므로
    // 도트 수에 따라 단계적으로 축소(zoom-out)한다.
    const fewDotZoom =
      dots.length <= 4 ? 0.3 + dots.length * 0.1 : 1;
    const scale =
      Math.min(drawableW / bboxW, drawableH / bboxH) * fewDotZoom;
    const drawnW = bboxW * scale;
    const drawnH = bboxH * scale;
    // 도트의 시각적 무게중심(centroid)을 컨테이너 중앙에 맞춘다.
    // bbox 기준 정렬은 비대칭 형상(좁고 긴 곶, 외딴 영토)에서 한쪽으로 치우쳐
    // 보이는 문제가 있어 dots 평균 위치를 사용한다.
    // 단 bbox가 padding 밖으로 나가면 컨테이너 안에 들어오도록 clamp한다.
    const centroidLocalX = (centroidLng - minLng + GRID_SIZE / 2) * scale;
    const centroidLocalY = (maxLat - centroidLat + GRID_SIZE / 2) * scale;
    let offX = size.width / 2 - centroidLocalX;
    let offY = size.height / 2 - centroidLocalY;
    if (offX < padding) offX = padding;
    else if (offX + drawnW > size.width - padding)
      offX = size.width - padding - drawnW;
    if (offY < padding) offY = padding;
    else if (offY + drawnH > size.height - padding)
      offY = size.height - padding - drawnH;
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
            // p.lng/lat은 1° 셀의 중심. bbox 좌측 가장자리 = minLng - GRID_SIZE/2.
            // 따라서 셀 중심까지의 bbox-local 오프셋은 (p.lng - minLng) + GRID_SIZE/2.
            const x =
              (p.lng - layout.minLng + GRID_SIZE / 2) * layout.scale +
              layout.offX -
              layout.dotPx / 2;
            const y =
              (layout.maxLat - p.lat + GRID_SIZE / 2) * layout.scale +
              layout.offY -
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: "100%",
  },
});
