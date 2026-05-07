import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "visitgrid:home:mapExtraHeight";

export async function loadMapExtraHeight(): Promise<number | null> {
  const v = await AsyncStorage.getItem(KEY);
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export async function saveMapExtraHeight(value: number): Promise<void> {
  await AsyncStorage.setItem(KEY, String(Math.max(0, Math.round(value))));
}
