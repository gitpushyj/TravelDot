import { useEffect, useMemo, useRef } from "react";
import { AppState } from "react-native";
import { Group, Rect } from "@shopify/react-native-skia";
import {
  cancelAnimation,
  Easing,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import {
  AIRPLANE_COLS,
  AIRPLANE_PIVOT_COL,
  AIRPLANE_PIVOT_ROW,
  AIRPLANE_PIXELS,
  AIRPLANE_ROWS,
} from "./airplanePixels";
import {
  greatCircleInterp,
  initialBearing,
  latToY,
  lngToX,
  sampleGreatCircle,
  toRad,
} from "./flightMath";
import { useFlightStore } from "./flightStore";

const PATH_SAMPLES = 50;

// 비행기 한 픽셀 = 도트 한 셀(gridSize*baseScale) × 이 비율.
// 0.32면 비행기 전체가 11 * 0.32 ≈ 3.5 셀 폭 (스펙: 도트 3 × 2.5개 분).
const AIRPLANE_PIXEL_RATIO = 0.32;

// 경로 점 한 개 = 도트 셀의 이 비율 (도트보다 작은 사각형).
const PATH_DOT_RATIO = 0.18;

type Props = {
  baseScale: number; // DotMap의 contentW = viewBoxW * baseScale 변환에 일치하는 값
  maxLat: number;
  gridSize: number;
};

export default function FlightOverlay({ baseScale, maxLat, gridSize }: Props) {
  const active = useFlightStore((s) => s.active);
  const checkArrival = useFlightStore((s) => s.checkArrival);

  // 0 → 1로 흐르는 진행률. withTiming(linear)로 남은 시간만큼 보간한다.
  // 앱 백그라운드 → foreground 전환 시 startProgress부터 다시 셋업해 실제 시각과 동기화.
  const progress = useSharedValue(0);

  // 살아있음 표현: 비행기를 진행 방향 직각으로 미세 wobble(±1.2px 정도).
  // 실제 비행시간이 길어 progress 변화가 느려도 비행기가 "살아 움직이는" 시각 신호를 준다.
  // 단위는 비행기 픽셀 기준 — 음수면 진행 방향 왼쪽으로 미세 흔들림.
  const wobble = useSharedValue(0);

  // 도착시각 도달을 polling으로 잡는다. setInterval 1초 tick + AppState 변화 시점.
  const arrivalIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // wobble 상시 재생. 비행 active 동안만.
  useEffect(() => {
    if (!active) {
      cancelAnimation(wobble);
      wobble.value = 0;
      return;
    }
    cancelAnimation(wobble);
    wobble.value = 0;
    wobble.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
        withTiming(-1, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
    return () => {
      cancelAnimation(wobble);
    };
  }, [active, wobble]);

  // active 비행이 바뀌거나 AppState가 active로 돌아올 때 progress를 (남은 시간)만큼 다시 보간.
  useEffect(() => {
    if (!active) {
      cancelAnimation(progress);
      progress.value = 0;
      return;
    }

    const setup = () => {
      const now = Date.now();
      const total = Math.max(1, active.arriveAt - active.departAt);
      const elapsed = now - active.departAt;
      const startP = Math.max(0, Math.min(1, elapsed / total));
      const remainingMs = Math.max(0, active.arriveAt - now);
      cancelAnimation(progress);
      progress.value = startP;
      if (remainingMs <= 0) {
        progress.value = 1;
        void checkArrival(now);
        return;
      }
      progress.value = withTiming(1, {
        duration: remainingMs,
        easing: Easing.linear,
      });
    };

    setup();

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") setup();
    });

    // 도착 시점 폴링. setInterval 30s. 비용 미미.
    if (arrivalIntervalRef.current) clearInterval(arrivalIntervalRef.current);
    arrivalIntervalRef.current = setInterval(() => {
      if (Date.now() >= active.arriveAt) {
        void checkArrival();
      }
    }, 30_000);

    return () => {
      sub.remove();
      if (arrivalIntervalRef.current) {
        clearInterval(arrivalIntervalRef.current);
        arrivalIntervalRef.current = null;
      }
    };
  }, [active, progress, checkArrival]);

  // 정적 파생값 — 비행이 바뀔 때만 재계산.
  const staticGeom = useMemo(() => {
    if (!active) return null;
    const { origin, destination } = active;
    const samples = sampleGreatCircle(
      origin.lat,
      origin.lng,
      destination.lat,
      destination.lng,
      PATH_SAMPLES
    );
    const pathPx = samples.map((p) => ({
      x: lngToX(p.lng, baseScale),
      y: latToY(p.lat, maxLat, baseScale),
    }));
    const bearingDeg = initialBearing(
      origin.lat,
      origin.lng,
      destination.lat,
      destination.lng
    );
    // SVG/Skia rotate 단위는 라디안(useDerivedValue 안). 정북 0° 그대로 적용 가능 —
    // 픽셀 그리드의 코가 row 0(위쪽)에 있어 회전 전 방향이 정북이기 때문.
    const bearingRad = toRad(bearingDeg);
    return { pathPx, bearingRad };
  }, [active, baseScale, maxLat]);

  // 비행기 픽셀 1개 크기·pivot 픽셀(화면 좌표계 기준).
  const cellPx = gridSize * baseScale;
  const planePx = cellPx * AIRPLANE_PIXEL_RATIO;
  const pivotPx = AIRPLANE_PIVOT_COL * planePx;
  const pivotPy = AIRPLANE_PIVOT_ROW * planePx;
  const pathDotPx = cellPx * PATH_DOT_RATIO;

  // 매 프레임 worklet — 비행기 현재 좌표.
  // wobble은 진행 방향(코) 기준 좌우(=픽셀 그리드의 X축)로 미세 흔들림을 더한다.
  // bearingRad 회전 안쪽에 translateX(wobble)를 넣어, 회전된 비행기 프레임의 좌우로
  // 흔들리도록 한다(절대 화면 좌우가 아니라 비행기 진행 방향 직각).
  const planeTransform = useDerivedValue(() => {
    if (!active || !staticGeom) {
      return [{ translateX: 0 }, { translateY: 0 }, { rotate: 0 }];
    }
    const t = progress.value;
    const p = greatCircleInterp(
      active.origin.lat,
      active.origin.lng,
      active.destination.lat,
      active.destination.lng,
      t
    );
    const x = lngToX(p.lng, baseScale);
    const y = latToY(p.lat, maxLat, baseScale);
    const wob = wobble.value * planePx * 0.4; // ±0.4 픽셀 단위
    return [
      { translateX: x },
      { translateY: y },
      { rotate: staticGeom.bearingRad },
      { translateX: -pivotPx + wob },
      { translateY: -pivotPy },
    ];
  });

  // 비행기 후미 트레일. 비행기 꼬리 바로 뒤(진행 방향 반대쪽)에 3개의 작은 점을 두어
  // 잔상 느낌을 준다. 트레일은 같은 회전 그룹 안에 있어 비행기와 함께 회전 + wobble.
  const TRAIL_COUNT = 3;
  const trailDotPx = planePx * 0.7;

  // worklet 시간 진행 외에 경로 점의 색을 progress 기반으로 바꾸기 위한 임계값.
  // 각 점 인덱스 i가 progress * (N-1)보다 작으면 "지나온 점"(진한 색).
  // opacity를 점마다 derivedValue로 따로 두면 50개 worklet — 비싸진 않지만,
  // 더 단순한 패턴: 두 layer로 모든 점을 흐린 색으로 한 번 그리고, 지나온 점은
  // 그 위에 진한 색으로 한 번 더 그린다. 진한 layer는 opacity를 worklet에서 각 점별로
  // 계산하지 않고, 점 인덱스 i에 대해 t = progress.value, alpha = i/(N-1) < t ? 1 : 0
  // 으로 결정. 사실 단순히 i/(N-1) <= t인 점들에 동일 색을 칠하면 충분.

  if (!active || !staticGeom) return null;

  return (
    <Group>
      {/* 경로 - 전체 점선 (흐린 색) */}
      {staticGeom.pathPx.map((pt, i) => (
        <Rect
          key={`pp-${i}`}
          x={pt.x - pathDotPx / 2}
          y={pt.y - pathDotPx / 2}
          width={pathDotPx}
          height={pathDotPx}
          color="rgba(255,255,255,0.32)"
        />
      ))}
      {/* 경로 - 지나온 점 진한 색 (각 점이 progress 임계를 넘으면 보임) */}
      {staticGeom.pathPx.map((pt, i) => (
        <ProgressPathDot
          key={`pa-${i}`}
          x={pt.x - pathDotPx / 2}
          y={pt.y - pathDotPx / 2}
          size={pathDotPx}
          index={i}
          total={staticGeom.pathPx.length}
          progress={progress}
        />
      ))}
      {/* 비행기 — outline(어두운) layer + body(흰색) layer + 후미 트레일 */}
      <Group transform={planeTransform}>
        {/* 트레일: 비행기 꼬리 뒤(진행 방향 반대쪽)에 점이 점점 흐려지며 깔린다.
            비행기 그리드의 row 좌표 기준으로 row > AIRPLANE_ROWS 쪽이 꼬리 뒤. */}
        {Array.from({ length: TRAIL_COUNT }).map((_, i) => {
          const offset = (i + 1) * planePx * 1.4;
          const alpha = 0.42 - i * 0.12;
          const cx = AIRPLANE_PIVOT_COL * planePx;
          const cy = AIRPLANE_ROWS * planePx + offset;
          return (
            <Rect
              key={`pl-t-${i}`}
              x={cx - trailDotPx / 2}
              y={cy - trailDotPx / 2}
              width={trailDotPx}
              height={trailDotPx}
              color={`rgba(255,255,255,${alpha})`}
            />
          );
        })}
        {/* outline: 픽셀 한 변보다 약간 더 크게 그려 1px 정도 어두운 테두리처럼 보임 */}
        {AIRPLANE_PIXELS.map((p) => (
          <Rect
            key={`pl-o-${p.col}-${p.row}`}
            x={p.col * planePx - planePx * 0.18}
            y={p.row * planePx - planePx * 0.18}
            width={planePx * 1.36}
            height={planePx * 1.36}
            color="rgba(0,0,0,0.65)"
          />
        ))}
        {AIRPLANE_PIXELS.map((p) => (
          <Rect
            key={`pl-w-${p.col}-${p.row}`}
            x={p.col * planePx}
            y={p.row * planePx}
            width={planePx}
            height={planePx}
            color="#ffffff"
          />
        ))}
      </Group>
    </Group>
  );
}

// 점선의 한 점. progress가 i/(total-1) 이상이면 진한 색으로 보인다.
// opacity를 derivedValue로 worklet에서 계산해 매 프레임 부드럽게 흐른다.
function ProgressPathDot({
  x,
  y,
  size,
  index,
  total,
  progress,
}: {
  x: number;
  y: number;
  size: number;
  index: number;
  total: number;
  progress: { value: number };
}) {
  const threshold = total > 1 ? index / (total - 1) : 0;
  const opacity = useDerivedValue(() => {
    "worklet";
    return progress.value >= threshold ? 1 : 0;
  });
  return (
    <Rect
      x={x}
      y={y}
      width={size}
      height={size}
      color="#ffffff"
      opacity={opacity}
    />
  );
}
