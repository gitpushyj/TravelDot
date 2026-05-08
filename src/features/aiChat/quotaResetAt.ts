import type { TFunction } from "i18next";

// AI 채팅 한도가 다음에 리셋되는 시각(서버 기준 KST 자정)을
// 사용자 디바이스의 로컬 시각으로 표현해주는 헬퍼.
// "내일 오전 9:00" / "tomorrow at 9:00 AM" 같은 i18n 텍스트를 반환한다.

// KST 자정 = UTC 전날 15:00. 다음 UTC 15:00 시각을 Date로 돌려준다.
export function nextKstMidnight(now: Date = new Date()): Date {
  const today15Utc = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      15,
      0,
      0,
      0
    )
  );
  if (today15Utc.getTime() > now.getTime()) return today15Utc;
  return new Date(today15Utc.getTime() + 24 * 60 * 60 * 1000);
}

// 사용자 앱 언어/디바이스 로케일로 "내일 오전 9:00" 같은 텍스트 생성.
// 디바이스 시각 기준 같은 날이면 "오늘 hh:mm", 아니면 "내일 hh:mm".
// (KST 자정 기준이라도 디바이스 시각으로 환산하면 같은 날일 수 있다 — 한국·일본·호주 동부 등.)
export function formatResetAtText(
  t: TFunction,
  lang: string,
  now: Date = new Date()
): string {
  const reset = nextKstMidnight(now);
  const time = reset.toLocaleTimeString(lang, {
    hour: "numeric",
    minute: "2-digit",
  });
  const sameDay = reset.toDateString() === now.toDateString();
  return t(
    sameDay ? "aiChat.relative.todayAt" : "aiChat.relative.tomorrowAt",
    { time }
  );
}
