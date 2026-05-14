# 프리미엄 기능 안내 페이지 — 설계

**작성일:** 2026-05-14
**상태:** 설계 승인 대기

## 배경 / 목적

앱 설치 후 사용자가 채팅(AI) 탭을 처음 누르면, 채팅으로 바로 진입시키지 않고
유료 기능을 실제 UI와 함께 소개하는 페이지를 **딱 한 번** 보여준다.

이 페이지는 설정 화면의 구독 안내(`SubscriptionScreen`)와는 **다른** 화면이다.
구독 안내는 요금제·결제 중심이고, 이 페이지는 "이 앱의 유료 기능이 무엇인지"를
홈페이지의 제품 소개처럼 실제 UI + 설명으로 보여주는 쇼케이스다.

대상 유료 기능: AI 여행 채팅 · 기기 동기화(cloud, 사진 제외) · 호칭/마일스톤 해제 ·
지도 스타일(dot 색·테마 변경).

## 동작 / 트리거

- **대상:** `tier === 'free'` 사용자만. tier가 아직 로딩 전(`null`)이면 띄우지 않는다
  — 유료 사용자가 잠깐이라도 안내 페이지를 보지 않도록, AiScreen의 기존
  `lockedForUpgrade` 판정과 동일한 보수적 기준을 쓴다.
- **트리거:** `MainTabs`의 AI `Tab.Screen` `tabPress` 리스너.
  `tier === 'free' && !seen`이면 `e.preventDefault()` 후
  `navigation.navigate('PremiumIntro')`.
- **"딱 한 번":** `PremiumIntroScreen`이 **마운트되는 순간** `seen` 플래그를
  set 한다(fire-and-forget). 이후로는 AI 탭을 눌러도 가로채지 않고 바로 채팅으로
  진입한다. 앱을 띄우자마자 강제 종료해도 다시 뜨지 않는다 — "딱 한 번 띄운다"의
  문자 그대로의 해석.
- **이탈 경로:**
  - 하단 기본 버튼 "구독 안내 보기" → `navigation.replace('Subscription')`
  - 하단 보조 링크 "나중에 할게요" → `navigation.goBack()` 후 AI 탭 활성화
  - 상단 X(닫기) 버튼은 두지 않는다.

## 네비게이션 통합 (접근 A — 별도 화면 + 탭 가로채기)

- `RootStackParamList`에 `PremiumIntro: undefined` 추가.
- `RootNavigator`에 `<Stack.Screen name="PremiumIntro"
  component={PremiumIntroScreenNav} />` 추가. `options={{ animation:
  "slide_from_bottom" }}`로 "띄우는" 느낌을 준다.
- `MainTabs`의 AI `Tab.Screen`에 `listeners`를 달아 `premiumIntroStore`와 tier를
  읽고 가로챈다.
- 닫을 때 AI 탭이 활성화되도록: "나중에 할게요"는 `navigation.goBack()` +
  `navigation.navigate('Main', { screen: 'AI' })`로 AI 탭으로 보낸다.
  ("구독 안내 보기"는 `replace`라 PremiumIntro가 스택에서 빠지고, 구독 화면을
  닫으면 직전 탭으로 돌아간다.)

## 영속화 — `src/features/premiumIntro/premiumIntroStore.ts`

- `src/features/onboarding/onboardingStore.ts` 패턴을 그대로 따른다:
  zustand + AsyncStorage.
- 스토리지 키: `visitgrid:premiumIntro:seen_v1`
- 상태: `{ hydrated: boolean; seen: boolean; hydrate(): Promise<void>;
  markSeen(): Promise<void> }`
- `App.tsx`의 hydrate effect에 `premiumIntroHydrate` 호출을 추가하고,
  `appReady` 조건에 `premiumIntroHydrated`를 추가한다 (기존 store들과 동일 패턴).

## 화면 구조 / 파일

책임 단위로 파일을 분리한다 (CLAUDE.md "Split Files Aggressively").

```
src/screens/PremiumIntroScreen/
  index.tsx              — 캐러셀 컨테이너(가로 paging), 페이징 상태, 마운트 시 markSeen
  PremiumIntroFooter.tsx — "구독 안내 보기" 버튼 + "나중에 할게요" 링크
  PagingDots.tsx         — 하단 4개 점 인디케이터
  styles.ts
  slides/
    SlideFrame.tsx       — 공통 틀: 아이콘+제목 / 한 줄 설명 / 데모 영역
    AiChatSlide.tsx
    DeviceSyncSlide.tsx
    TitlesSlide.tsx
    MapStyleSlide.tsx
src/navigation/screens/PremiumIntroScreenNav.tsx
```

- 레이아웃: 좌우 스와이프 캐러셀. 한 화면에 기능 1개. 하단에 4개 점 인디케이터.
- 슬라이드 한 장의 구성("데모 중심"): 상단 아이콘+제목 → 한 줄 설명 →
  큰 UI 데모 영역.
- CTA(`구독 안내 보기` 버튼 + `나중에 할게요` 링크)는 캐러셀 바깥 **하단 고정**.
  모든 슬라이드에서 동일하게 노출된다.

## 슬라이드별 데모 (혼합 충실도)

순서는 사용자가 나열한 순서를 따른다.

| # | 기능 | 데모 내용 | 구현 방식 |
|---|---|---|---|
| 1 | AI 여행 채팅 | 샘플 Q&A 버블 (여행 통계·추천 예시) | 실제 `AiChatBubble` 재사용, 정적 메시지 주입 |
| 2 | 기기 동기화 | 폰 ⇄ 태블릿 동기화 일러스트 + "사진 제외" 명시 | 이 화면 전용 양식화된 목업 |
| 3 | 호칭·마일스톤 해제 | 뱃지 메달 그리드 (약 6개) | 실제 `BadgeMedal` 재사용 |
| 4 | 지도 스타일 | 팔레트 스와치 + 테마 세그먼트 | 실제 `PalettePicker`/`MapThemeLockRow`의 시각 구조 재사용, 정적 |

- 모든 데모는 **비인터랙티브**(보여주기용). 실제 컴포넌트를 재사용할 때
  `onPress` 등 핸들러는 no-op으로 넘긴다.
- 데모에 쓰는 샘플 텍스트(채팅 Q&A, 뱃지 이름 등)는 i18n 키로 둔다.

## i18n

- `premiumIntro` 네임스페이스를 신설한다.
- **ko + en만 작성**하고, 나머지 8개 로케일은 `fallbackLng: "en"`로 자동 폴백한다
  (구독 화면 `restore` 키 등에서 팀이 이미 쓰는 관행 — `docs/iap-progress.md` 참고).
- 키 범위: 슬라이드 4개의 제목·설명, 데모 샘플 텍스트, 하단 CTA 2개 문구.

## 엣지 케이스

- **무료 → 유료 전환 후 재진입:** tier가 `'free'`가 아니므로 탭 가로채기를 하지
  않는다. 안내 페이지 없이 바로 채팅 진입.
- **재설치:** AsyncStorage가 초기화되므로 다시 1회 노출된다 (의도된 동작).
- **구독 화면 갔다가 돌아옴:** "구독 안내 보기"는 `replace`로 이동하므로
  PremiumIntro는 스택에 남지 않는다. 마운트 시 이미 `seen = true`로 set 됐으므로
  다음 탭 누름부터는 바로 채팅으로 진입한다.
- **tier 로딩 전(`null`):** 가로채지 않는다. 사용자가 그 순간 채팅 탭을 누르면
  채팅으로 들어가고, 안내 페이지는 다음 기회(여전히 `!seen`)에 노출된다.

## 변경/추가 파일 요약

**신규**
- `src/features/premiumIntro/premiumIntroStore.ts`
- `src/screens/PremiumIntroScreen/` (index, PremiumIntroFooter, PagingDots,
  styles, slides/×5)
- `src/navigation/screens/PremiumIntroScreenNav.tsx`

**수정**
- `src/navigation/types.ts` — `RootStackParamList`에 `PremiumIntro` 추가
- `src/navigation/RootNavigator.tsx` — `PremiumIntro` 스크린 등록
- `src/navigation/MainTabs.tsx` — AI 탭 `tabPress` 가로채기 리스너
- `App.tsx` — `premiumIntroStore` hydrate 게이트 연결
- `src/i18n/locales/ko.json`, `src/i18n/locales/en.json` — `premiumIntro` 키

## 범위 밖 (YAGNI)

- 안내 페이지의 인터랙티브 데모 (실제 채팅 입력, 실제 팔레트 적용 등) — 보여주기용
  정적 데모만.
- 유료 사용자용 별도 노출 경로.
- 안내 페이지를 다시 보는 진입점 (설정 등) — 요구된 적 없음.
- 다른 탭(홈/국가/설정)에서의 유사 인터스티셜.
