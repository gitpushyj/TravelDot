export type BirthDate = { year: number; month: number; day: number };

export function ageAtTimestamp(takenAtMs: number, birth: BirthDate): number {
  const d = new Date(takenAtMs);
  const ty = d.getFullYear();
  const tm = d.getMonth() + 1;
  const td = d.getDate();
  let age = ty - birth.year;
  if (tm < birth.month || (tm === birth.month && td < birth.day)) age -= 1;
  return age < 0 ? -1 : age;
}
