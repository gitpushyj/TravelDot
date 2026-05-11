// trip 시작/종료 날짜를 사람이 읽기 좋은 형태로 포맷한다. 일수 표기는 i18n에
// 의존하므로 여기서는 다루지 않고, 호출처에서 t("common.daysSuffix", { count })를
// 붙인다.
//
// - 1일짜리:        "yyyy.mm.dd"
// - 다일 같은 해:   "yyyy.mm.dd – mm.dd"
// - 다일 다른 해:   "yyyy.mm.dd – yyyy.mm.dd"
export function formatTripDateRange(
  startDate: string,
  endDate: string
): string {
  const [sy, sm, sd] = startDate.split("-");
  const [ey, em, ed] = endDate.split("-");
  if (startDate === endDate) {
    return `${sy}.${sm}.${sd}`;
  }
  const startStr = `${sy}.${sm}.${sd}`;
  const endStr = sy === ey ? `${em}.${ed}` : `${ey}.${em}.${ed}`;
  return `${startStr} – ${endStr}`;
}
