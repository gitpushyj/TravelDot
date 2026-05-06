// ISO 3166-1 alpha-2 코드를 regional indicator 이모지로 변환한다.
const A_OFFSET = 0x1f1e6 - "A".charCodeAt(0);

export function flagEmoji(code: string): string {
  const cc = code?.toUpperCase();
  if (!cc || cc.length !== 2 || !/^[A-Z]{2}$/.test(cc)) return "🏳️";
  return String.fromCodePoint(
    A_OFFSET + cc.charCodeAt(0),
    A_OFFSET + cc.charCodeAt(1)
  );
}
