import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "visitgrid:homeCountry";
const CHANGED_KEY = "visitgrid:homeCountryChanged_v1";

export type HomeCountry = { code: string; name: string };

export async function loadHomeCountry(): Promise<HomeCountry | null> {
  const v = await AsyncStorage.getItem(KEY);
  return v ? (JSON.parse(v) as HomeCountry) : null;
}

export async function saveHomeCountry(c: HomeCountry): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(c));
}

// 본국 바꾸기는 앱 생애에 1회만 허용되므로 그 사용 여부를 별도 플래그로 보관한다.
export async function loadHomeCountryChanged(): Promise<boolean> {
  return (await AsyncStorage.getItem(CHANGED_KEY)) === "done";
}

export async function markHomeCountryChanged(): Promise<void> {
  await AsyncStorage.setItem(CHANGED_KEY, "done");
}
