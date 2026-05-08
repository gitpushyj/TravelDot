const MAX_IMAGES = 4;
const IMG_RE = /!\[[^\]]*\]\((https:\/\/[^)\s]+)\)/g;

export type ParsedAssistant = {
  text: string;
  imageUrls: string[];
};

export function parseAssistantText(raw: string): ParsedAssistant {
  const urls: string[] = [];
  const seen = new Set<string>();
  for (const m of raw.matchAll(IMG_RE)) {
    const url = m[1];
    if (seen.has(url)) continue;
    if (urls.length < MAX_IMAGES) {
      urls.push(url);
      seen.add(url);
    }
    // 4장 초과 매칭이어도 본문 토큰은 모두 제거(노이즈 방지)
  }
  let text = raw.replace(IMG_RE, "");
  text = text.replace(/\n{3,}/g, "\n\n");
  return { text, imageUrls: urls };
}
