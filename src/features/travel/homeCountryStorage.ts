import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "visitgrid:homeCountry";

export type HomeCountry = { code: string; name: string };

export async function loadHomeCountry(): Promise<HomeCountry | null> {
  const v = await AsyncStorage.getItem(KEY);
  return v ? (JSON.parse(v) as HomeCountry) : null;
}

export async function saveHomeCountry(c: HomeCountry): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(c));
}
