// 핀치/팬 worklet에서 공유하는 clamp 유틸. Reanimated worklet 사양 때문에
// 같은 함수의 worklet/JS 변형을 둘 다 둔다.

export function clamp(v: number, min: number, max: number) {
  "worklet";
  return Math.max(min, Math.min(max, v));
}

export function clampJs(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

// scale=1을 기준으로 콘텐츠 크기(contentW/H)와 뷰포트 크기(viewportW/H)가
// 다를 수 있다. 콘텐츠가 뷰포트보다 작거나 같으면 가운데 정렬, 크면 끝이
// 비우지 않도록 [viewport - s*content, 0] 범위로 제한한다.
export function clampPanX(
  value: number,
  s: number,
  viewportW: number,
  contentW: number
) {
  "worklet";
  if (viewportW <= 0 || contentW <= 0) return 0;
  const total = s * contentW;
  if (total <= viewportW) return (viewportW - total) / 2;
  return Math.min(0, Math.max(viewportW - total, value));
}

export function clampPanY(
  value: number,
  s: number,
  viewportH: number,
  contentH: number
) {
  "worklet";
  if (viewportH <= 0 || contentH <= 0) return 0;
  const total = s * contentH;
  if (total <= viewportH) return (viewportH - total) / 2;
  return Math.min(0, Math.max(viewportH - total, value));
}
