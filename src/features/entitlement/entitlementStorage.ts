import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "visitgrid:entitlement:isAllMilestoneVisible";

export async function loadIsAllMilestoneVisible(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(KEY);
    return v === "true";
  } catch {
    return false;
  }
}

export async function saveIsAllMilestoneVisible(value: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, value ? "true" : "false");
  } catch {}
}
