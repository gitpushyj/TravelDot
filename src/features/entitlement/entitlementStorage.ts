import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "visitgrid:entitlement:isPremium";

export async function loadIsPremium(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(KEY);
    return v === "true";
  } catch {
    return false;
  }
}

export async function saveIsPremium(value: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, value ? "true" : "false");
  } catch {}
}
