import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  StyleProp,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { Canvas, Group, RoundedRect } from "@shopify/react-native-skia";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useTranslation } from "react-i18next";
import {
  cancelAnimation,
  Easing,
  runOnJS,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import dotData from "../../assets/data/dots.json";
import { COUNTRY_CAPITALS } from "../data/countryCapitals";
import FlightOverlay from "../features/flight/FlightOverlay";
import { useFlightStore } from "../features/flight/flightStore";
import { useVisitStore } from "../features/travel/visitStore";
import { getCurrentLocale } from "../i18n";
import { getCountryName } from "../lib/countryName";
import { colorForVisitOnMap, useMapTheme, useTheme } from "../theme/themeStore";
import { homeDotColor } from "../utils/countryColors";
import type { CountryRef, DotData } from "../types";

import { clamp, clampJs, clampPanX, clampPanY } from "./DotMap/clamps";
import Legend from "./DotMap/Legend";
import { styles } from "./DotMap/styles";

const FILL_RATIO = 0.6;
const MIN_SCALE = 1;
const MAX_SCALE = 10;
// 인트로 줌아웃이 멈추는 최종 배율. 1이면 세계지도 전체가 보이는데
// 도트가 너무 작아져서 약간 줌인된 상태에서 멈춘다 (세계의 약 3/4가 viewport에 들어옴).
const INTRO_END_SCALE = 1.33;
// 인트로 줌아웃이 시작하는 최소 배율. 본국이 미국·프랑스처럼 영토가 크거나
// 알래스카·DOM-TOM 같은 멀리 떨어진 영토를 포함하면 bbox 기반 target이 1에
// 가까워져 줌아웃 애니메이션이 사라진다. 한국 같은 작은 본국과 동일하게
// 본토에 크게 줌인된 상태에서 시작하도록 시작 스케일에 하한을 둔다.
const INTRO_MIN_START_SCALE = 8;
// 핀치 도중 한 프레임에 focal이 이만큼 점프하면 비정상으로 보고 무시한다.
// Android의 ACTION_POINTER_UP에서 centroid가 남은 손가락으로 튀는 현상 차단용.
// 일반 핀치 프레임에서는 focal이 한 두 픽셀씩만 움직이므로 24px이면 충분.
const FOCAL_JUMP_GUARD_PX = 24;

type Props = {
  visitCounts?: Record<string, number>;
  enableZoom?: boolean;
  // 핀치/팬이 시작·종료될 때 호출. 부모 ScrollView 스크롤을 일시 잠그는 데 사용.
  onInteractingChange?: (interacting: boolean) => void;
  // 탭/팬/핀치 어느 것이든 사용자 손가락이 지도 위에 올라온 순간 1회 호출.
  // RNGH GestureDetector가 네이티브에서 터치를 잡아버려 부모 onTouchStart가
  // 안 들어오므로, 외부에서 "지도 만짐"을 감지해야 할 때 사용한다.
  onUserInteract?: () => void;
  // 기본 width:100% + aspectRatio 360/145 대신 직접 사이즈를 지정하고 싶을 때.
  mapAreaStyle?: StyleProp<ViewStyle>;
  // 한 도트가 여러 나라에 걸쳐 있을 때 선택 UI 없이 첫 국가를 자동 선택.
  autoPickFirst?: boolean;
  // 첫 진입 시 본국에서 세계지도로 줌아웃하는 인트로 애니메이션을 재생할지 여부.
  playIntro?: boolean;
  // 부모 View가 시계방향(rotate: "90deg")으로 회전되어 있는 경우 true.
  // RNGH가 보고하는 translation/focal/탭 좌표를 회전된 로컬 프레임으로 되돌린다.
  parentRotated90?: boolean;
  // 비행 시작 시 viewport를 출발지 줌인 → 1.5초 줌아웃으로 자동 전환할지 여부.
  // 메인 화면에만 true. MapZoomScreen 등 다른 instance에서는 false로 두어 사용자의
  // 자유 줌/팬을 방해하지 않는다.
  flightAutoZoom?: boolean;
  // 방문 횟수에 따라 색이 진해진다는 사실을 알려주는 작은 범례를 좌하단에
  // 띄울지 여부. 캡처용(ShareMapCard)이나 회전된 컨테이너(MapZoomScreen)에서는
  // false로 끈다.
  showLegend?: boolean;
};

export default function DotMap({
  visitCounts: visitCountsProp,
  enableZoom = true,
  onInteractingChange,
  onUserInteract,
  mapAreaStyle,
  autoPickFirst = false,
  playIntro = true,
  parentRotated90 = false,
  flightAutoZoom = false,
  showLegend = true,
}: Props) {
  const { dots, gridSize, minLat, maxLat } = dotData as DotData;
  const viewBoxW = 360;
  const viewBoxH = maxLat - minLat;
  const [size, setSize] = useState({ width: 0, height: 0 });
  // 한 도트가 여러 나라에 걸쳐 있을 때만 사용하는 임시 선택지.
  const [pending, setPending] = useState<CountryRef[] | null>(null);
  const storeVisitCounts = useVisitStore((s) => s.visitCounts);
  const visitCounts = visitCountsProp ?? storeVisitCounts;
  const homeCountry = useVisitStore((s) => s.homeCountry);
  const selectedCountry = useVisitStore((s) => s.selectedCountry);
  const setSelectedCountry = useVisitStore((s) => s.setSelectedCountry);
  const theme = useTheme();
  const mapTheme = useMapTheme();
  const { t } = useTranslation();

  // viewport가 자연 비율(360:viewBoxH)보다 길어지면(예: 사용자가 홈 화면에서
  // 지도 아래쪽을 끌어내려 높이를 키운 경우) 짧은 축 기준으로는 콘텐츠가
  // 비어 보이므로, 더 큰 축 기준으로 cover 스케일을 잡아 콘텐츠가 양 축을
  // 모두 채우도록 한다. 자연 비율에서는 두 값이 같아 동작이 동일하다.
  const widthFit = size.width > 0 ? size.width / viewBoxW : 0;
  const heightFit = size.height > 0 ? size.height / viewBoxH : 0;
  const baseScale = Math.max(widthFit, heightFit) || 1;
  const contentW = viewBoxW * baseScale;
  const contentH = viewBoxH * baseScale;

  const dotPx = gridSize * FILL_RATIO * baseScale;
  const halfDotPx = dotPx / 2;
  const radius = dotPx * 0.25;

  const homeCode = homeCountry?.code;
  const homeFill = useMemo(
    () => homeDotColor(homeCode, mapTheme.homeColor),
    [homeCode, mapTheme.homeColor]
  );
  const positioned = useMemo(
    () =>
      dots.map((d) => {
        const fallback: CountryRef[] = d.country
          ? [{ code: d.country, name: d.name ?? d.country }]
          : [];
        const countries =
          d.countries && d.countries.length ? d.countries : fallback;
        // 본국이 도트의 countries 배열 중 어디에라도 들어있으면 본국으로 간주한다.
        // countries[0]만 보면 국경 도트(예: ES-FR, IT-FR)가 본국 색 대신 인접국 색이나
        // selectedCountry 하이라이트(노랑)로 칠해지는 문제가 생긴다.
        const isHome =
          homeCode != null && countries.some((c) => c.code === homeCode);
        // 한 도트가 여러 나라를 덮을 때(예: 마카오+홍콩) 가장 많이 방문한 나라
        // 기준으로 칠한다. countries[0]만 보면 비주류 나라 방문이 무시된다.
        let count = 0;
        for (const c of countries) {
          const n = visitCounts[c.code] ?? 0;
          if (n > count) count = n;
        }
        return {
          id: d.id,
          x: (d.lng + 180) * baseScale - halfDotPx,
          y: (maxLat - d.lat) * baseScale - halfDotPx,
          countries,
          isHome,
          fill: isHome
            ? homeFill
            : colorForVisitOnMap(mapTheme, { count, isHomeCountry: false }),
        };
      }),
    [dots, baseScale, halfDotPx, maxLat, visitCounts, homeCode, mapTheme, homeFill]
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

  // 제스처 useMemo가 매번 재생성되지 않도록 콜백은 ref로 안정화한다.
  const userInteractRef = useRef(onUserInteract);
  useEffect(() => {
    userInteractRef.current = onUserInteract;
  }, [onUserInteract]);
  const fireUserInteract = useCallback(() => {
    userInteractRef.current?.();
  }, []);

  const viewW = size.width;
  const viewH = size.height;

  // 제스처 객체는 매 렌더마다 새로 만들면 GestureDetector가 핸들러를 재부착해
  // 진행 중인 핀치/팬에서 savedScale/savedTx 등이 중간값으로 다시 캡처되어
  // 화면이 튕기는 스터터가 발생한다. useMemo로 안정화한다.
  const pinch = useMemo(
    () =>
      Gesture.Pinch()
        .onBegin(() => {
          runOnJS(fireUserInteract)();
        })
        .onStart(() => {
          cancelAnimation(scale);
          cancelAnimation(tx);
          cancelAnimation(ty);
          // focal은 첫 onChange에서 캡처 (onStart의 focalX는 불안정).
          pinchPrimed.value = false;
          runOnJS(notifyInteracting)(true);
        })
        .onChange((e) => {
          // 손가락이 한 개 이하로 떨어지는 프레임은 무시한다 (iOS 케이스).
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
          const dx = e.focalX - prevFocalX.value;
          const dy = e.focalY - prevFocalY.value;
          // Android 케이스: ACTION_POINTER_UP 프레임에서 ScaleGestureDetector가
          // 떨어지는 손가락을 제외하고 focal을 재계산하지만 numberOfPointers는
          // 여전히 2로 보고된다. 위 가드로는 못 막으므로 focal 점프 크기로 차단.
          if (Math.abs(dx) > FOCAL_JUMP_GUARD_PX || Math.abs(dy) > FOCAL_JUMP_GUARD_PX) {
            prevFocalX.value = e.focalX;
            prevFocalY.value = e.focalY;
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
          const rawTx = e.focalX * (1 - r) + tx.value * r + dx;
          const rawTy = e.focalY * (1 - r) + ty.value * r + dy;
          tx.value = clampPanX(rawTx, newScale, viewW, contentW);
          ty.value = clampPanY(rawTy, newScale, viewH, contentH);
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
      contentW,
      contentH,
      notifyInteracting,
      fireUserInteract,
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
        .onBegin(() => {
          runOnJS(fireUserInteract)();
        })
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
          // RNGH의 translationX/Y는 부모의 회전 transform을 따라가지 않고
          // 화면 픽셀 축을 그대로 보고한다. 부모가 시계방향 90° 회전된 경우
          // 사용자의 가로 드래그가 콘텐츠 로컬 프레임에서는 X축으로 와야 하므로
          // (sx, sy) → (sy, -sx) 매핑으로 회전을 풀어준다.
          const dx = parentRotated90 ? e.translationY : e.translationX;
          const dy = parentRotated90 ? -e.translationX : e.translationY;
          tx.value = clampPanX(savedTx.value + dx, s, viewW, contentW);
          ty.value = clampPanY(savedTy.value + dy, s, viewH, contentH);
        })
        .onEnd(() => {
          savedTx.value = tx.value;
          savedTy.value = ty.value;
        })
        .onFinalize(() => {
          runOnJS(notifyInteracting)(false);
        }),
    [
      viewW,
      viewH,
      contentW,
      contentH,
      notifyInteracting,
      fireUserInteract,
      scale,
      tx,
      ty,
      savedTx,
      savedTy,
      parentRotated90,
    ]
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
      if (!bestCountries || bestCountries.length === 0) {
        // 도트가 없는 여백을 탭하면 본국을 선택지로 돌려준다.
        if (homeCountry) {
          setPending(null);
          setSelectedCountry({
            code: homeCountry.code,
            name: homeCountry.name,
          });
        }
        return;
      }
      if (bestCountries.length === 1 || autoPickFirst) {
        const c = bestCountries[0];
        setPending(null);
        setSelectedCountry({ code: c.code, name: c.name });
      } else {
        setPending(bestCountries);
      }
    },
    [
      positioned,
      halfDotPx,
      baseScale,
      gridSize,
      setSelectedCountry,
      autoPickFirst,
      homeCountry,
    ]
  );

  // 첫 진입 시 본국을 2초 보여준 뒤 4초에 걸쳐 세계지도로 줌아웃하는 인트로 애니메이션.
  const introPlayed = useRef(false);
  useEffect(() => {
    if (!playIntro) return;
    if (introPlayed.current) return;
    if (size.width === 0 || size.height === 0) return;
    if (!homeCode) return;

    const cxs: number[] = [];
    const cys: number[] = [];
    let minCx = Infinity;
    let minCy = Infinity;
    let maxCx = -Infinity;
    let maxCy = -Infinity;
    for (const d of positioned) {
      if (!d.countries.some((c) => c.code === homeCode)) continue;
      const cx = d.x + halfDotPx;
      const cy = d.y + halfDotPx;
      cxs.push(cx);
      cys.push(cy);
      if (cx < minCx) minCx = cx;
      if (cy < minCy) minCy = cy;
      if (cx > maxCx) maxCx = cx;
      if (cy > maxCy) maxCy = cy;
    }
    if (cxs.length === 0) return;

    // 본국 도트 좌표의 median. 멀리 떨어진 영토/섬(미국 알래스카·하와이,
    // 프랑스 DOM-TOM 등)의 영향을 거의 받지 않아 본토 중심에 가깝게 잡힌다.
    cxs.sort((a, b) => a - b);
    cys.sort((a, b) => a - b);
    const medianCx = cxs[Math.floor(cxs.length / 2)];
    const medianCy = cys[Math.floor(cys.length / 2)];

    // 시작 중심점: 본국 수도 좌표가 있으면 그걸 사용(가장 미관 좋음).
    // 없으면 median으로 fallback.
    const capital = COUNTRY_CAPITALS[homeCode];
    let startCx: number;
    let startCy: number;
    if (capital) {
      const [capLat, capLng] = capital;
      startCx = (capLng + 180) * baseScale;
      startCy = (maxLat - capLat) * baseScale;
    } else {
      startCx = medianCx;
      startCy = medianCy;
    }

    // 시작 줌은 본국 bbox에 맞춘 값을 쓰되, 큰 본국(미국·프랑스 등)에서도
    // 줌아웃 애니메이션이 충분히 보이도록 INTRO_MIN_START_SCALE 이상으로 보장.
    const padding = 1.6;
    const bboxW = Math.max(maxCx - minCx, 1);
    const bboxH = Math.max(maxCy - minCy, 1);
    const bboxFit = Math.min(
      size.width / (bboxW * padding),
      size.height / (bboxH * padding)
    );
    const target = clampJs(
      Math.max(bboxFit, INTRO_MIN_START_SCALE),
      MIN_SCALE,
      MAX_SCALE
    );
    const rawTargetTx = size.width / 2 - target * startCx;
    const rawTargetTy = size.height / 2 - target * startCy;
    const targetTx = clampPanX(rawTargetTx, target, size.width, contentW);
    const targetTy = clampPanY(rawTargetTy, target, size.height, contentH);

    introPlayed.current = true;
    scale.value = target;
    tx.value = targetTx;
    ty.value = targetTy;
    savedTx.value = targetTx;
    savedTy.value = targetTy;

    // 종료 위치는 수도가 아닌 본토 중심(median)을 쓴다. 수도가 본토 한쪽에
    // 치우친 본국(예: 미국=워싱턴이 동부 해안)에서 줌아웃이 끝났을 때
    // 본국이 시야 한쪽으로 쏠리는 것을 막는다.
    const endScale = INTRO_END_SCALE;
    const endTx = clampPanX(
      size.width / 2 - endScale * medianCx,
      endScale,
      size.width,
      contentW
    );
    const endTy = clampPanY(
      size.height / 2 - endScale * medianCy,
      endScale,
      size.height,
      contentH
    );

    const easing = Easing.inOut(Easing.cubic);
    scale.value = withDelay(500, withTiming(endScale, { duration: 3000, easing }));
    tx.value = withDelay(500, withTiming(endTx, { duration: 3000, easing }));
    ty.value = withDelay(
      500,
      withTiming(endTy, { duration: 3000, easing }, (finished) => {
        if (finished) {
          savedTx.value = endTx;
          savedTy.value = endTy;
        }
      })
    );
  }, [
    playIntro,
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

  // 비행 시작 시 자동 viewport 줌. 출발지에 줌인된 상태에서 시작 → 1.5초에 걸쳐 부드럽게
  // 줌아웃해 출발+도착지가 모두 보이는 viewport로 이동. flightAutoZoom prop이 true인
  // instance(메인 화면)에서만 발동한다. MapZoom 전체화면에서는 자동 줌을 띄우지 않는다.
  const activeFlight = useFlightStore((s) => s.active);
  const lastAutoZoomedFlightIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!flightAutoZoom) return;
    if (size.width === 0 || size.height === 0) return;
    const id = activeFlight?.id ?? null;
    if (id === lastAutoZoomedFlightIdRef.current) return;
    lastAutoZoomedFlightIdRef.current = id;
    if (!activeFlight) return;
    if (contentW <= 0 || contentH <= 0) return;

    // 시작 viewport: 출발 공항이 화면 중앙, 도시 한두 개가 보일 만한 줌인 배율.
    const startScale = clampJs(5, MIN_SCALE, MAX_SCALE);
    const ox = (activeFlight.origin.lng + 180) * baseScale;
    const oy = (maxLat - activeFlight.origin.lat) * baseScale;
    const startTx = clampPanX(
      size.width / 2 - startScale * ox,
      startScale,
      size.width,
      contentW
    );
    const startTy = clampPanY(
      size.height / 2 - startScale * oy,
      startScale,
      size.height,
      contentH
    );

    // 종료 viewport: 두 공항 bounding box + padding 1.4 fit.
    const dx2 = (activeFlight.destination.lng + 180) * baseScale;
    const dy2 = (maxLat - activeFlight.destination.lat) * baseScale;
    const minCx = Math.min(ox, dx2);
    const maxCx = Math.max(ox, dx2);
    const minCy = Math.min(oy, dy2);
    const maxCy = Math.max(oy, dy2);
    const padding = 1.4;
    const bboxW = Math.max(maxCx - minCx, 1);
    const bboxH = Math.max(maxCy - minCy, 1);
    const endScale = clampJs(
      Math.min(size.width / (bboxW * padding), size.height / (bboxH * padding)),
      MIN_SCALE,
      MAX_SCALE
    );
    const cx = (minCx + maxCx) / 2;
    const cy = (minCy + maxCy) / 2;
    const endTx = clampPanX(
      size.width / 2 - endScale * cx,
      endScale,
      size.width,
      contentW
    );
    const endTy = clampPanY(
      size.height / 2 - endScale * cy,
      endScale,
      size.height,
      contentH
    );

    cancelAnimation(scale);
    cancelAnimation(tx);
    cancelAnimation(ty);

    // 같은 JS tick에서 `scale.value = startScale` 후 `scale.value = withTiming(end)`을
    // 연달아 호출하면, 첫 set이 worklet 스레드에 반영되기 전에 withTiming이 큐잉되어
    // 시작값이 startScale이 아닌 이전 값(예: 인트로가 끝낸 1.33)부터 보간되는 race가
    // 생긴다. withSequence로 한 번에 묶어 정의하면 worklet에서 일관되게 처리되어
    // "줌인 → 1.5초 줌아웃" 시퀀스가 항상 의도대로 보인다.
    //
    // 비행 시작 모달의 slide-down(약 280~330ms) 동안 줌 시퀀스가 시작되면 사용자
    // 시야가 모달에 가려 출발지 줌인이 안 보이는 문제가 있다. setTimeout으로 modal close
    // 시간만큼 기다린 뒤 worklet에 schedule해 modal lifecycle/cancelAnimation과의 race를
    // 분리한다 (withDelay를 sharedValue.value = withSequence(...) 안에 두는 방식은 같은
    // JS tick에서 cancelAnimation과 충돌해 보간 자체가 시작되지 않는 케이스가 있었음).
    const easing = Easing.inOut(Easing.cubic);
    const MODAL_GUARD_MS = 350;
    const guardTimer = setTimeout(() => {
      scale.value = withSequence(
        withTiming(startScale, { duration: 0 }),
        withTiming(endScale, { duration: 1500, easing })
      );
      tx.value = withSequence(
        withTiming(startTx, { duration: 0 }),
        withTiming(endTx, { duration: 1500, easing })
      );
      ty.value = withSequence(
        withTiming(startTy, { duration: 0 }),
        withTiming(endTy, { duration: 1500, easing }, (finished) => {
          if (finished) {
            savedTx.value = endTx;
            savedTy.value = endTy;
          }
        })
      );
    }, MODAL_GUARD_MS);
    // savedTx/Ty는 시퀀스가 끝나면 위 콜백에서 endTx/Ty로 set된다.
    // 그 사이에 사용자가 pan/pinch를 시작해도 각 제스처의 onStart에서 tx/ty 현재값을
    // 다시 잡으므로 일관성은 유지된다.
    return () => clearTimeout(guardTimer);
  }, [
    flightAutoZoom,
    activeFlight,
    size.width,
    size.height,
    baseScale,
    contentW,
    contentH,
    maxLat,
    scale,
    tx,
    ty,
    savedTx,
    savedTy,
  ]);

  // 부모가 viewport 높이를 변경하면(예: 홈 화면에서 지도 영역을 늘림) baseScale이
  // 바뀌어 콘텐츠 크기가 달라진다. 정지 상태의 tx/ty가 새 범위를 벗어날 수 있어
  // 다시 클램프한다. 단, 첫 onLayout 직후에는 인트로 effect가 막 큐잉한
  // withTiming 애니메이션을 덮어써 취소하지 않도록 건너뛴다.
  const lastClampedSize = useRef({ width: 0, height: 0 });
  useEffect(() => {
    const prev = lastClampedSize.current;
    lastClampedSize.current = { width: size.width, height: size.height };
    if (size.width === 0 || size.height === 0) return;
    if (prev.width === 0 || prev.height === 0) return;
    if (prev.width === size.width && prev.height === size.height) return;
    if (contentW <= 0 || contentH <= 0) return;
    const s = scale.value;
    const cx = clampPanX(tx.value, s, size.width, contentW);
    const cy = clampPanY(ty.value, s, size.height, contentH);
    tx.value = cx;
    ty.value = cy;
    savedTx.value = cx;
    savedTy.value = cy;
  }, [size.width, size.height, contentW, contentH, scale, tx, ty, savedTx, savedTy]);

  const tap = useMemo(
    () =>
      Gesture.Tap()
        .maxDistance(8)
        .onBegin(() => {
          runOnJS(fireUserInteract)();
        })
        .onEnd((e) => {
          const wx = (e.x - tx.value) / scale.value;
          const wy = (e.y - ty.value) / scale.value;
          runOnJS(onTap)(wx, wy);
        }),
    [onTap, fireUserInteract, scale, tx, ty]
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
                      highlightedIds?.has(d.id) && !d.isHome
                        ? mapTheme.highlightDot
                        : d.fill
                    }
                  />
                ))}
                <FlightOverlay
                  baseScale={baseScale}
                  maxLat={maxLat}
                  gridSize={gridSize}
                />
              </Group>
            </Canvas>
          </GestureDetector>
        )}
        {showLegend && !parentRotated90 && size.width > 0 && (
          <Legend heatmap={mapTheme.heatmap} mode={mapTheme.mode} />
        )}
      </View>
      {pending && pending.length > 0 && (
        <View
          style={[
            styles.caption,
            {
              backgroundColor: theme.cardBg,
              borderTopColor: theme.cardBorder,
            },
          ]}
        >
          <Text style={[styles.captionLabel, { color: theme.textSecondary }]}>
            {t("dotMap.highlightPrompt")}
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
                  {getCountryName(c.code, getCurrentLocale())}
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
                {t("common.cancel")}
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

