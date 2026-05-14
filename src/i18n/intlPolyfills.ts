// Hermes는 빌드에 따라 Intl.DisplayNames가 없거나, 있더라도 일부 region
// 코드를 그대로 돌려줘 endonym으로 폴백되는 케이스가 있다. 모든 플랫폼에서
// 일관된 결과를 보장하기 위해 formatjs 폴리필을 무조건 로드한다.
// 의존 순서: getCanonicalLocales → Locale → DisplayNames.
// .js 확장자는 일부 locale-data 진입점의 잘못된 exports 매핑(it/ru)에서
// Metro 폴백 경고를 피하기 위해 명시한다.

import "@formatjs/intl-getcanonicallocales/polyfill-force.js";
import "@formatjs/intl-locale/polyfill-force.js";
import "@formatjs/intl-displaynames/polyfill-force.js";

// 지원하는 10개 locale의 region 표시 이름 데이터.
// zh-CN은 zh-Hans, zh-TW는 zh-Hant로 매핑된다 (CLDR 기본 동작).
import "@formatjs/intl-displaynames/locale-data/en.js";
import "@formatjs/intl-displaynames/locale-data/ko.js";
import "@formatjs/intl-displaynames/locale-data/ja.js";
import "@formatjs/intl-displaynames/locale-data/zh-Hans.js";
import "@formatjs/intl-displaynames/locale-data/zh-Hant.js";
import "@formatjs/intl-displaynames/locale-data/es.js";
import "@formatjs/intl-displaynames/locale-data/de.js";
import "@formatjs/intl-displaynames/locale-data/fr.js";
import "@formatjs/intl-displaynames/locale-data/it.js";
import "@formatjs/intl-displaynames/locale-data/ru.js";
