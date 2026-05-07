// 핀치/팬 worklet에서 공유하는 clamp 유틸. Reanimated worklet 사양 때문에
// 같은 함수의 worklet/JS 변형을 둘 다 둔다.

export function clamp(v: number, min: number, max: number) {
  "worklet";
  return Math.max(min, Math.min(max, v));
}

export function clampJs(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

// scale=1일 때 콘텐츠가 뷰포트와 정확히 맞도록 설계되어 있으므로,
// 줌이 들어가면 tx∈[w*(1-s), 0], ty∈[h*(1-s), 0] 안에서만 움직여야 콘텐츠가 화면을 비우지 않는다.
export function clampPanX(value: number, s: number, w: number) {
  "worklet";
  if (w <= 0) return 0;
  const min = w * (1 - s);
  return Math.min(0, Math.max(min, value));
}

export function clampPanY(value: number, s: number, h: number) {
  "worklet";
  if (h <= 0) return 0;
  const min = h * (1 - s);
  return Math.min(0, Math.max(min, value));
}
