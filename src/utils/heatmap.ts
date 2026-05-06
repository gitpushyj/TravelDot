// 라이트 테마 토큰을 그대로 재내보낸다 (기존 import 호환).
// 다크 모드 대응 컴포넌트는 useTheme()을 직접 사용한다.
import { LIGHT_THEME, colorForVisitWith } from "../theme/theme";

export const HEATMAP_PALETTE = LIGHT_THEME.heatmap;
export const HOME_COLOR = LIGHT_THEME.homeColor;
export const BG_COLOR = LIGHT_THEME.legacyDarkBg;
export const HOME_BG = LIGHT_THEME.homeBg;
export const CARD_BG = LIGHT_THEME.cardBg;
export const CARD_BORDER = LIGHT_THEME.cardBorder;
export const TEXT_PRIMARY = LIGHT_THEME.textPrimary;
export const TEXT_SECONDARY = LIGHT_THEME.textSecondary;
export const TEXT_MUTED = LIGHT_THEME.textMuted;
export const ACCENT = LIGHT_THEME.accent;
export const ACCENT_SOFT_BG = LIGHT_THEME.accentSoftBg;
export const ACCENT_SOFT_TEXT = LIGHT_THEME.accentSoftText;
export const TAB_ROW_BG = LIGHT_THEME.tabRowBg;

export function colorForVisit(opts: {
  count: number;
  isHomeCountry: boolean;
}): string {
  return colorForVisitWith(LIGHT_THEME, opts);
}
