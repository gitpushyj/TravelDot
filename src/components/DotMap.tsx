import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { Canvas, Group, RoundedRect } from "@shopify/react-native-skia";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import {
  cancelAnimation,
  Easing,
  runOnJS,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import dotData from "../../assets/data/dots.json";
import { useVisitStore } from "../features/travel/visitStore";
import { useTheme } from "../theme/themeStore";
import { colorForVisitWith } from "../theme/theme";
import type { CountryRef, DotData } from "../types";

const FILL_RATIO = 0.6;
const MIN_SCALE = 1;
const MAX_SCALE = 10;

type Props = {
  visitCounts?: Record<string, number>;
  enableZoom?: boolean;
  // 핀치/팬이 시작·종료될 때 호출. 부모 ScrollView 스크롤을 일시 잠그는 데 사용.
  onInteractingChange?: (interacting: boolean) => void;
  // 기본 width:100% + aspectRatio 360/145 대신 직접 사이즈를 지정하고 싶을 때.
  mapAreaStyle?: StyleProp<ViewStyle>;
  // 한 도트가 여러 나라에 걸쳐 있을 때 선택 UI 없이 첫 국가를 자동 선택.
  autoPickFirst?: boolean;
};

export default function DotMap({
  visitCounts: visitCountsProp,
  enableZoom = true,
  onInteractingChange,
  mapAreaStyle,
  autoPickFirst = false,
}: Props) {
  const { dots, gridSize, minLat, maxLat } = dotData as DotData;
  const [size, setSize] = useState({ width: 0, height: 0 });
  // 한 도트가 여러 나라에 걸쳐 있을 때만 사용하는 임시 선택지.
  const [pending, setPending] = useState<CountryRef[] | null>(null);
  const storeVisitCounts = useVisitStore((s) => s.visitCounts);
  const visitCounts = visitCountsProp ?? storeVisitCounts;
  const homeCountry = useVisitStore((s) => s.homeCountry);
  const selectedCountry = useVisitStore((s) => s.selectedCountry);
  const setSelectedCountry = useVisitStore((s) => s.setSelectedCountry);
  const theme = useTheme();

  const viewBoxW = 360;
  const drawWidth = size.width;
  const baseScale = drawWidth / viewBoxW || 1;

  const dotPx = gridSize * FILL_RATIO * baseScale;
  const halfDotPx = dotPx / 2;
  const radius = dotPx * 0.25;

  const homeCode = homeCountry?.code;
  const positioned = useMemo(
    () =>
      dots.map((d) => {
        const fallback: CountryRef[] = d.country
          ? [{ code: d.country, name: d.name ?? d.country }]
          : [];
        const countries =
          d.countries && d.countries.length ? d.countries : fallback;
        const primary = countries[0]?.code;
        const isHome = primary != null && primary === homeCode;
        const count = primary ? visitCounts[primary] ?? 0 : 0;
        return {
          id: d.id,
          x: (d.lng + 180) * baseScale - halfDotPx,
          y: (maxLat - d.lat) * baseScale - halfDotPx,
          countries,
          fill: colorForVisitWith(theme, { count, isHomeCountry: isHome }),
        };
      }),
    [dots, baseScale, halfDotPx, maxLat, visitCounts, homeCode, theme]
  );

  const highlightedIds = useMemo(() => {
    if (!selectedCountry) return null;
    const ids = new Set<string>();
    for (const d of positioned) {
      if (d.countries.some((c) => c.code === selectedCountry.code)) {
        ids.add(d.id);
      }
    }
    return ids;
  }, [positioned, selectedCountry]);

  const scale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const savedTx = useSharedValue(0);
  const savedTy = useSharedValue(0);
  // 핀치는 delta(scaleChange) + 이전 focal 추적 방식으로 처리한다.
  // RNGH 공식 문서: onStart/onBegin에서 focal을 사용하면 first frame에 불연속이
  // 생길 수 있으므로 첫 onChange에서 prev focal을 초기화해야 한다.
  const prevFocalX = useSharedValue(0);
  const prevFocalY = useSharedValue(0);
  const pinchPrimed = useSharedValue(false);

  const notifyInteracting = useCallback(
    (interacting: boolean) => {
      onInteractingChange?.(interacting);
    },
    [onInteractingChange]
  );

  const viewW = size.width;
  const viewH = size.height;

  // 제스처 객체는 매 렌더마다 새로 만들면 GestureDetector가 핸들러를 재부착해
  // 진행 중인 핀치/팬에서 savedScale/savedTx 등이 중간값으로 다시 캡처되어
  // 화면이 튕기는 스터터가 발생한다. useMemo로 안정화한다.
  const pinch = useMemo(
    () =>
      Gesture.Pinch()
        .onStart(() => {
          cancelAnimation(scale);
          cancelAnimation(tx);
          cancelAnimation(ty);
          // focal은 첫 onChange에서 캡처 (onStart의 focalX는 불안정).
          pinchPrimed.value = false;
          runOnJS(notifyInteracting)(true);
        })
        .onChange((e) => {
          // 손가락이 한 개 이하로 떨어지는 프레임은 무시한다.
          // 두 손가락이 동시에 떨어지지 않기 때문에 한쪽이 먼저 떨어지는 순간
          // focal(centroid)이 남은 손가락 쪽으로 급격히 점프하며, 그 점프가
          // dx/dy로 환산되어 지도가 왼/오른쪽으로 튕기는 원인이 된다.
          if (e.numberOfPointers < 2) return;
          if (!pinchPrimed.value) {
            prevFocalX.value = e.focalX;
            prevFocalY.value = e.focalY;
            pinchPrimed.value = true;
            return;
          }
          // 사진 앱 스타일 핀치 줌: scaleChange(증분)으로 현재 focal에서 줌하고,
          // focal 이동분(dx, dy)을 더해 손가락 중심 아래 world 포인트를 고정한다.
          const newScale = clamp(
            scale.value * e.scaleChange,
            MIN_SCALE,
            MAX_SCALE
          );
          const r = newScale / scale.value;
          const dx = e.focalX - prevFocalX.value;
          const dy = e.focalY - prevFocalY.value;
          const rawTx = e.focalX * (1 - r) + tx.value * r + dx;
          const rawTy = e.focalY * (1 - r) + ty.value * r + dy;
          tx.value = clampPanX(rawTx, newScale, viewW);
          ty.value = clampPanY(rawTy, newScale, viewH);
          scale.value = newScale;
          prevFocalX.value = e.focalX;
          prevFocalY.value = e.focalY;
        })
        .onEnd(() => {
          savedTx.value = tx.value;
          savedTy.value = ty.value;
        })
        .onFinalize(() => {
          pinchPrimed.value = false;
          runOnJS(notifyInteracting)(false);
        }),
    [
      viewW,
      viewH,
      notifyInteracting,
      scale,
      tx,
      ty,
      savedTx,
      savedTy,
      prevFocalX,
      prevFocalY,
      pinchPrimed,
    ]
  );

  // 한 손가락 드래그만 pan으로 사용. 두 손가락 입력은 pinch 단독으로 처리해 충돌을 막는다.
  const pan = useMemo(
    () =>
      Gesture.Pan()
        .maxPointers(1)
        .onStart(() => {
          cancelAnimation(scale);
          cancelAnimation(tx);
          cancelAnimation(ty);
          savedTx.value = tx.value;
          savedTy.value = ty.value;
          runOnJS(notifyInteracting)(true);
        })
        .onUpdate((e) => {
          const s = scale.value;
          tx.value = clampPanX(savedTx.value + e.translationX, s, viewW);
          ty.value = clampPanY(savedTy.value + e.translationY, s, viewH);
        })
        .onEnd(() => {
          savedTx.value = tx.value;
          savedTy.value = ty.value;
        })
        .onFinalize(() => {
          runOnJS(notifyInteracting)(false);
        }),
    [viewW, viewH, notifyInteracting, scale, tx, ty, savedTx, savedTy]
  );

  const onTap = useCallback(
    (worldX: number, worldY: number) => {
      const cellPx = gridSize * baseScale;
      const hitR = cellPx * 0.75;
      const hitR2 = hitR * hitR;
      let bestCountries: CountryRef[] | null = null;
      let bestDist = Infinity;
      for (const d of positioned) {
        const cx = d.x + halfDotPx;
        const cy = d.y + halfDotPx;
        const dx = worldX - cx;
        const dy = worldY - cy;
        const dist = dx * dx + dy * dy;
        if (dist < hitR2 && dist < bestDist) {
          bestCountries = d.countries;
          bestDist = dist;
        }
      }
      if (!bestCountries || bestCountries.length === 0) return;
      if (bestCountries.length === 1 || autoPickFirst) {
        const c = bestCountries[0];
        setPending(null);
        setSelectedCountry({ code: c.code, name: c.name });
      } else {
        setPending(bestCountries);
      }
    },
    [positioned, halfDotPx, baseScale, gridSize, setSelectedCountry, autoPickFirst]
  );

  // 첫 진입 시 본국을 2초 보여준 뒤 4초에 걸쳐 세계지도로 줌아웃하는 인트로 애니메이션.
  const introPlayed = useRef(false);
  useEffect(() => {
    if (introPlayed.current) return;
    if (size.width === 0 || size.height === 0) return;
    if (!homeCode) return;

    let minCx = Infinity;
    let minCy = Infinity;
    let maxCx = -Infinity;
    let maxCy = -Infinity;
    for (const d of positioned) {
      if (!d.countries.some((c) => c.code === homeCode)) continue;
      const cx = d.x + halfDotPx;
      const cy = d.y + halfDotPx;
      if (cx < minCx) minCx = cx;
      if (cy < minCy) minCy = cy;
      if (cx > maxCx) maxCx = cx;
      if (cy > maxCy) maxCy = cy;
    }
    if (!isFinite(minCx)) return;

    const padding = 1.6;
    const bboxW = Math.max(maxCx - minCx, 1);
    const bboxH = Math.max(maxCy - minCy, 1);
    const target = clampJs(
      Math.min(size.width / (bboxW * padding), size.height / (bboxH * padding)),
      MIN_SCALE,
      MAX_SCALE
    );
    const cx0 = (minCx + maxCx) / 2;
    const cy0 = (minCy + maxCy) / 2;
    const rawTargetTx = size.width / 2 - target * cx0;
    const rawTargetTy = size.height / 2 - target * cy0;
    const targetTx = clampJs(rawTargetTx, size.width * (1 - target), 0);
    const targetTy = clampJs(rawTargetTy, size.height * (1 - target), 0);

    introPlayed.current = true;
    scale.value = target;
    tx.value = targetTx;
    ty.value = targetTy;
    savedTx.value = targetTx;
    savedTy.value = targetTy;

    const easing = Easing.inOut(Easing.cubic);
    scale.value = withDelay(500, withTiming(1, { duration: 4000, easing }));
    tx.value = withDelay(500, withTiming(0, { duration: 4000, easing }));
    ty.value = withDelay(
      500,
      withTiming(0, { duration: 4000, easing }, (finished) => {
        if (finished) {
          savedTx.value = 0;
          savedTy.value = 0;
        }
      })
    );
  }, [
    size.width,
    size.height,
    homeCode,
    positioned,
    halfDotPx,
    scale,
    tx,
    ty,
    savedTx,
    savedTy,
  ]);

  const tap = useMemo(
    () =>
      Gesture.Tap()
        .maxDistance(8)
        .onEnd((e) => {
          const wx = (e.x - tx.value) / scale.value;
          const wy = (e.y - ty.value) / scale.value;
          runOnJS(onTap)(wx, wy);
        }),
    [onTap, scale, tx, ty]
  );

  const composed = useMemo(
    () =>
      enableZoom ? Gesture.Race(tap, Gesture.Simultaneous(pinch, pan)) : tap,
    [enableZoom, tap, pinch, pan]
  );

  const transform = useDerivedValue(() => [
    { translateX: tx.value },
    { translateY: ty.value },
    { scale: scale.value },
  ]);

  return (
    <View style={styles.root}>
      <View
        style={[styles.mapArea, mapAreaStyle]}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          if (width !== size.width || height !== size.height) {
            setSize({ width, height });
          }
        }}
      >
        {size.width > 0 && (
          <GestureDetector gesture={composed}>
            <Canvas style={{ width: size.width, height: size.height }}>
              <Group transform={transform}>
                {positioned.map((d) => (
                  <RoundedRect
                    key={d.id}
                    x={d.x}
                    y={d.y}
                    width={dotPx}
                    height={dotPx}
                    r={radius}
                    color={
                      highlightedIds?.has(d.id) ? theme.highlightDot : d.fill
                    }
                  />
                ))}
              </Group>
            </Canvas>
          </GestureDetector>
        )}
      </View>
      {pending && pending.length > 0 && (
        <View style={styles.caption}>
          <Text style={[styles.captionLabel, { color: theme.textSecondary }]}>
            어느 나라의 도트를 강조할까요?
          </Text>
          <View style={styles.optionRow}>
            {pending.map((c) => (
              <Pressable
                key={c.code}
                style={({ pressed }) => [
                  styles.optionBtn,
                  {
                    backgroundColor: pressed
                      ? theme.optionBtnPressedBg
                      : theme.optionBtnBg,
                    borderColor: theme.optionBtnBorder,
                  },
                ]}
                onPress={() => {
                  setSelectedCountry({ code: c.code, name: c.name });
                  setPending(null);
                }}
              >
                <Text style={[styles.optionText, { color: theme.textPrimary }]}>
                  {c.name}
                </Text>
              </Pressable>
            ))}
            <Pressable
              style={({ pressed }) => [
                styles.optionBtn,
                {
                  backgroundColor: pressed
                    ? theme.optionBtnPressedBg
                    : theme.optionBtnBg,
                  borderColor: theme.optionBtnBorder,
                },
              ]}
              onPress={() => setPending(null)}
            >
              <Text style={[styles.optionText, { color: theme.textPrimary }]}>
                취소
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

function clamp(v: number, min: number, max: number) {
  "worklet";
  return Math.max(min, Math.min(max, v));
}

function clampJs(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

// scale=1일 때 콘텐츠가 뷰포트와 정확히 맞도록 설계되어 있으므로,
// 줌이 들어가면 tx∈[w*(1-s), 0], ty∈[h*(1-s), 0] 안에서만 움직여야 콘텐츠가 화면을 비우지 않는다.
function clampPanX(value: number, s: number, w: number) {
  "worklet";
  if (w <= 0) return 0;
  const min = w * (1 - s);
  return Math.min(0, Math.max(min, value));
}

function clampPanY(value: number, s: number, h: number) {
  "worklet";
  if (h <= 0) return 0;
  const min = h * (1 - s);
  return Math.min(0, Math.max(min, value));
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "transparent",
  },
  mapArea: {
    width: "100%",
    aspectRatio: 360 / 145,
    backgroundColor: "transparent",
    overflow: "hidden",
  },
  caption: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  captionLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  optionText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
