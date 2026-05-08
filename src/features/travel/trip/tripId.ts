// RFC 4122 v4 호환 형태의 ID. 트립은 push 전 로컬에서 ID를 확정해야
// (오프라인 작성 → 나중에 sync) 클라이언트 측 생성이 필수다.
// 별도 의존성 추가를 피하기 위해 Math.random 기반으로 작게 구현. 두 기기에서
// 같은 ID를 만들 확률은 무시할 수 있는 수준.
export function newTripId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
