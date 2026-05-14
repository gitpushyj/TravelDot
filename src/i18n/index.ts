import "./intlPolyfills";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";

import en from "./locales/en.json";
import ko from "./locales/ko.json";
import ja from "./locales/ja.json";
import zhCN from "./locales/zh-CN.json";
import zhTW from "./locales/zh-TW.json";
import es from "./locales/es.json";
import de from "./locales/de.json";
import fr from "./locales/fr.json";
import it from "./locales/it.json";
import ru from "./locales/ru.json";

export const SUPPORTED_LOCALES = [
  "en",
  "ko",
  "ja",
  "zh-CN",
  "zh-TW",
  "es",
  "de",
  "fr",
  "it",
  "ru",
] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_LABELS: Record<SupportedLocale, string> = {
  en: "English",
  ko: "한국어",
  ja: "日本語",
  "zh-CN": "简体中文",
  "zh-TW": "繁體中文",
  es: "Español",
  de: "Deutsch",
  fr: "Français",
  it: "Italiano",
  ru: "Русский",
};

const STORAGE_KEY = "visitgrid.locale";

function resolveDeviceLocale(): SupportedLocale {
  const tags = Localization.getLocales().map((l) => l.languageTag);
  for (const tag of tags) {
    const exact = SUPPORTED_LOCALES.find((l) => l.toLowerCase() === tag.toLowerCase());
    if (exact) return exact;
    const base = tag.split("-")[0]?.toLowerCase();
    if (base === "zh") {
      const region = tag.split("-")[1]?.toUpperCase();
      if (region === "TW" || region === "HK" || region === "MO") return "zh-TW";
      return "zh-CN";
    }
    const baseMatch = SUPPORTED_LOCALES.find((l) => l.toLowerCase() === base);
    if (baseMatch) return baseMatch;
  }
  return "en";
}

export async function initI18n() {
  let stored: string | null = null;
  try {
    stored = await AsyncStorage.getItem(STORAGE_KEY);
  } catch {}
  const initial =
    (stored && (SUPPORTED_LOCALES as readonly string[]).includes(stored)
      ? (stored as SupportedLocale)
      : null) ?? resolveDeviceLocale();

  await i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      ko: { translation: ko },
      ja: { translation: ja },
      "zh-CN": { translation: zhCN },
      "zh-TW": { translation: zhTW },
      es: { translation: es },
      de: { translation: de },
      fr: { translation: fr },
      it: { translation: it },
      ru: { translation: ru },
    },
    lng: initial,
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    returnNull: false,
    compatibilityJSON: "v4",
  });

  return i18n;
}

export async function setAppLocale(locale: SupportedLocale) {
  await i18n.changeLanguage(locale);
  try {
    await AsyncStorage.setItem(STORAGE_KEY, locale);
  } catch {}
}

export function getCurrentLocale(): SupportedLocale {
  const lng = i18n.language;
  if ((SUPPORTED_LOCALES as readonly string[]).includes(lng)) {
    return lng as SupportedLocale;
  }
  return "en";
}

export default i18n;
