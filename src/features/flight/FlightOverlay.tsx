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
  AIRPLANE_PIXELS_ACCENT,
  AIRPLANE_PIXELS_BODY,
  AIRPLANE_RED_LIGHT,
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
// 13×13 그리드에서 0.27 → 비행기 전체가 13 * 0.27 ≈ 3.5 셀 폭. 11×10 기존 크기와
// 비슷한 화면 면적을 유지하면서 픽셀 수만 풍부해진다.
const AIRPLANE_PIXEL_RATIO = 0.27;

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

  // 꼬리 끝 빨간 anti-collision 점등. 실제 비콘 패턴(약 1초에 한 번, 짧게 깜빡)
  // 을 흉내내 opacity 0.18 ↔ 1을 빠르게 왕복한다.
  const redBlink = useSharedValue(0);

  // 목적지 도트 빨간 깜빡 펄스. 비행기 비콘과는 별도 사이클로 더 부드럽게 호흡하도록
  // 1.4초 주기 sin-easing pulse를 적용한다.
  const destPulse = useSharedValue(0);

  // 도착시각 도달을 polling으로 잡는다. setInterval 1초 tick + AppState 변화 시점.
  const arrivalIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // wobble + redBlink 상시 재생. 비행 active 동안만.
  useEffect(() => {
    if (!active) {
      cancelAnimation(wobble);
      cancelAnimation(redBlink);
      wobble.value = 0;
      redBlink.value = 0;
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
    // anti-collision beacon: 약 1초 사이클로 짧게 빨강 점등.
    // 110ms 동안 풀 밝기, 그 후 약 890ms 동안 어둡게(0.18). 실제 항공기 비콘 분위기.
    cancelAnimation(redBlink);
    redBlink.value = 0.18;
    redBlink.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 80, easing: Easing.out(Easing.cubic) }),
        withTiming(0.18, { duration: 220, easing: Easing.in(Easing.cubic) }),
        withTiming(0.18, { duration: 700, easing: Easing.linear })
      ),
      -1,
      false
    );
    // 목적지 도트 펄스: 1.4초 주기로 부드럽게 호흡(0.25 ↔ 1). 비콘과는 분리된 리듬.
    cancelAnimation(destPulse);
    destPulse.value = 0.25;
    destPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.25, { duration: 700, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
    return () => {
      cancelAnimation(wobble);
      cancelAnimation(redBlink);
      cancelAnimation(destPulse);
    };
  }, [active, wobble, redBlink, destPulse]);

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
    // 목적지 도트 위치 (도트지도 좌표계). 빨간 깜빡 도트의 고정 위치로 사용.
    const destX = lngToX(destination.lng, baseScale);
    const destY = latToY(destination.lat, maxLat, baseScale);
    return { pathPx, bearingRad, destX, destY };
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
      {/* 목적지 도트 빨간 펄스. 도트지도의 도트와 같은 크기. 비행기 layer 아래에 두어
          비행기가 도착했을 때도 비행기가 더 위로 보이게 한다. */}
      <DestinationPulse
        x={staticGeom.destX}
        y={staticGeom.destY}
        size={cellPx * 0.6}
        opacity={destPulse}
      />
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
        {/* outline: 모든 픽셀(흰 body + 파란 accent)의 가장자리를 어둡게 그려
            검은 outline 효과. 살짝 큰 사각형을 먼저 깔고 그 위에 색 layer를 덮는다. */}
        {AIRPLANE_PIXELS.map((p) => (
          <Rect
            key={`pl-o-${p.col}-${p.row}`}
            x={p.col * planePx - planePx * 0.18}
            y={p.row * planePx - planePx * 0.18}
            width={planePx * 1.36}
            height={planePx * 1.36}
            color="rgba(0,0,0,0.7)"
          />
        ))}
        {/* body: 흰색 채움 */}
        {AIRPLANE_PIXELS_BODY.map((p) => (
          <Rect
            key={`pl-w-${p.col}-${p.row}`}
            x={p.col * planePx}
            y={p.row * planePx}
            width={planePx}
            height={planePx}
            color="#ffffff"
          />
        ))}
        {/* accent: 파란 액센트(조종석, 날개 줄, 창문) — body 위에 덮어 그린다 */}
        {AIRPLANE_PIXELS_ACCENT.map((p) => (
          <Rect
            key={`pl-b-${p.col}-${p.row}`}
            x={p.col * planePx}
            y={p.row * planePx}
            width={planePx}
            height={planePx}
            color="#2b6cff"
          />
        ))}
        {/* 꼬리 끝 빨간 anti-collision 점등. 좌표는 AIRPLANE_RED_LIGHT,
            opacity는 redBlink sharedValue를 통해 약 1초 사이클로 깜빡임. */}
        <RedBeacon
          x={AIRPLANE_RED_LIGHT.col * planePx}
          y={AIRPLANE_RED_LIGHT.row * planePx}
          size={planePx}
          opacity={redBlink}
        />
      </Group>
    </Group>
  );
}

// 목적지 도트 빨간 펄스. (x, y)는 도트지도 좌표계에서 도트의 중심.
// 도트지도의 다른 도트들과 같은 크기 정도의 빨간 사각형 + 살짝 큰 반투명 후광.
// opacity는 destPulse sharedValue로 1.4초 주기 호흡.
function DestinationPulse({
  x,
  y,
  size,
  opacity,
}: {
  x: number;
  y: number;
  size: number;
  opacity: { value: number };
}) {
  const halo = size * 2.4;
  return (
    <>
      <Rect
        x={x - halo / 2}
        y={y - halo / 2}
        width={halo}
        height={halo}
        color="rgba(255,40,40,0.35)"
        opacity={opacity}
      />
      <Rect
        x={x - size / 2}
        y={y - size / 2}
        width={size}
        height={size}
        color="#ff2a2a"
        opacity={opacity}
      />
    </>
  );
}

// 꼬리 끝 빨간 anti-collision 점등.
// - 가장 바깥에 살짝 큰 어두운 후광(halo)을 두어 도트지도 위에서 빨간색이 묻히지 않게.
// - 그 위에 살짝 큰 반투명 빨강 글로우, 마지막에 진한 빨강 코어. 모두 opacity는 redBlink를
//   공유해 동시에 깜빡인다(코어가 풀일 때 글로우도 풀).
function RedBeacon({
  x,
  y,
  size,
  opacity,
}: {
  x: number;
  y: number;
  size: number;
  opacity: { value: number };
}) {
  const halo = size * 1.9;
  const glow = size * 1.4;
  return (
    <>
      <Rect
        x={x - (halo - size) / 2}
        y={y - (halo - size) / 2}
        width={halo}
        height={halo}
        color="rgba(120,0,0,0.55)"
        opacity={opacity}
      />
      <Rect
        x={x - (glow - size) / 2}
        y={y - (glow - size) / 2}
        width={glow}
        height={glow}
        color="rgba(255,80,80,0.85)"
        opacity={opacity}
      />
      <Rect
        x={x}
        y={y}
        width={size}
        height={size}
        color="#ff2a2a"
        opacity={opacity}
      />
    </>
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
