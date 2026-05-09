import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "visitgrid:allCountries:prefs";

export type FilterKey = "all" | "visited" | "unvisited";
export type SortKey = "name" | "popular";

export const FILTER_KEYS: FilterKey[] = ["all", "visited", "unvisited"];
export const SORT_KEYS: SortKey[] = ["name", "popular"];

export type AllCountriesPrefs = {
  filter: FilterKey;
  sort: SortKey;
};

export const DEFAULT_PREFS: AllCountriesPrefs = {
  filter: "all",
  sort: "popular",
};

export async function loadAllCountriesPrefs(): Promise<AllCountriesPrefs | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw) as Partial<AllCountriesPrefs>;
    const filter =
      obj.filter && FILTER_KEYS.includes(obj.filter) ? obj.filter : null;
    const sort = obj.sort && SORT_KEYS.includes(obj.sort) ? obj.sort : null;
    if (!filter || !sort) return null;
    return { filter, sort };
  } catch {
    return null;
  }
}

export async function saveAllCountriesPrefs(
  prefs: AllCountriesPrefs
): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {}
}
