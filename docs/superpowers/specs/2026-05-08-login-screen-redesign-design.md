# 로그인 화면 리디자인 설계

## 배경

사용자가 제공한 참조 이미지에 맞춰 로그인 화면을 재구성한다. 동시에 다음을 정리한다.

- Google/Apple 로그인 버튼을 공식 브랜드 가이드라인에 맞게 정비해 스토어 심사 risk를 제거.
- 기존의 두 로그인 진입점(`Onboarding/LoginStep`, `LoginScreen`)을 단일 컴포넌트로 통합.
- 온보딩의 `WelcomeStep`(환영 4-포인트)을 로그인 화면에 흡수해 단계 수를 6→5로 축소.

## 디자인 결정 (사용자 답변 반영)

- 좌측에 로고+타이틀+서브타이틀, 우측에 hero 이미지(여행가방).
- Google 버튼(흰 배경) + Apple 버튼(검정 배경). 둘 다 chevron `>` 포함.
- "또는" 디바이더 후 가로 3-카드로 핵심 가치 노출.
- 약관/개인정보 라인은 노출하지 않음.
- 진행 바는 온보딩 컨텍스트에서만 노출. 재로그인 시에는 `LoginStep`만 단독 렌더링.

## 카드 콘텐츠 매핑

원본 `welcome.point1~4`를 카드 3종으로 압축. point4(마일스톤)는 메인의 마일스톤 기능에서 노출되므로 카드에서는 생략.

| 카드 | 제목                | 설명                                |
| ---- | ------------------- | ----------------------------------- |
| 1    | 사진으로 자동 기록  | 위치·시간으로 일정이 자동 분류돼요  |
| 2    | 한 번에 지도 색칠   | 여행 끝내고 버튼 한 번이면 끝이에요 |
| 3    | 기기에만 저장       | 사진은 서버로 보내지 않아요         |

11개 로케일 모두 번역.

## 파일 구조 변경

신규:

- `src/components/auth/GoogleGIcon.tsx` — 공식 4색 G SVG.
- `src/components/auth/AppleLogoIcon.tsx` — 공식 Apple 심볼 SVG.
- `src/components/auth/GoogleSignInButton.tsx` — 흰 배경 버튼(아이콘+라벨+chevron).
- `src/components/auth/AppleSignInButton.tsx` — 검정 배경 버튼(아이콘+라벨+chevron).
- `src/screens/Onboarding/LoginHero.tsx` — 좌(로고+타이틀+서브) + 우(hero 이미지) 영역.
- `src/screens/Onboarding/LoginFeatureCards.tsx` — 3-카드 영역.
- `src/screens/Onboarding/LoginDivider.tsx` — "또는" 디바이더.

수정:

- `src/screens/Onboarding/LoginStep.tsx` — 위 컴포넌트로 새 레이아웃 구성. parent wrapper 없이도 풀스크린으로 동작하도록 self-contained하게 작성.
- `src/screens/Onboarding/index.tsx` — `TOTAL_STEPS=5`, step 매핑 재정렬, `WelcomeStep` import/렌더 제거, hydrate effect의 step 임계값(2/3/4) 갱신.
- `App.tsx` — 로그아웃 분기에서 `LoginScreen` 대신 `LoginStep` 단독 렌더링.
- `src/i18n/locales/*.json` — 신규 i18n 키 11개 로케일 추가.

삭제:

- `src/screens/LoginScreen.tsx`
- `src/screens/Onboarding/WelcomeStep.tsx`

## 브랜딩 컴플라이언스

- **Google**: 공식 4색 G SVG, 흰 배경 + 어두운 텍스트, "Google로 계속하기". Google Sign-In 가이드라인 준수.
- **Apple**: 공식 Apple 심볼 SVG, 검정 배경 + 흰 로고/텍스트, 최소 높이 44pt. Apple HIG의 Sign in with Apple 가이드라인 준수.
- 외부 이미지 없이 inline SVG로 처리(react-native-svg는 이미 의존성).

## 온보딩 단계 흐름 변경

이전(6단계): `Welcome → Login → HomeCountry → BirthGender → Sync → SuspectTrips`
이후(5단계): `WelcomeLogin → HomeCountry → BirthGender → Sync → SuspectTrips`

`OnboardingFlow/index.tsx`:

- `TOTAL_STEPS = 5`
- step 매핑 1~5 재정렬
- 외부 상태 effect의 임계값을 한 단계씩 당김:
  - `if (next < 2 && authUser) next = 2;` (was 3)
  - `if (next < 3 && homeCountry) next = 3;` (was 4)
  - `if (next < 4 && profile) next = 4;` (was 5)
- `autoCompleteEvaluatedRef` 로직은 그대로(authUser+homeCountry 체크).

## 재로그인(로그아웃 후) 처리

- `App.tsx`에서 `!authUser` 분기는 `<LoginStep onNext={() => {}} />`를 직접 렌더(progress 바 없이).
- 로그인 성공 시 `authUser`가 채워지면 App.tsx 상위 분기에서 자동으로 메인 UI로 라우팅됨(`onNext`는 호출되지 않아도 OK).

## 검증 기준

- iOS 시뮬레이터: Google/Apple 버튼 모두 표시, 누르면 정상 로그인 흐름 진입.
- Android 에뮬레이터: Apple 버튼 hidden, Google 버튼만 정상 표시.
- 로그아웃 후 재진입 시 동일 디자인으로 노출(progress 바만 미노출).
- 11개 로케일에서 카드 텍스트 끊김/넘침 없이 표시.
- 사용자 참조 이미지와 큰 시각 차이 없음.

## Out of scope

- 약관/개인정보 페이지 신설.
- 외부 hero 이미지 다운로드/교체 — 기존 `assets/login_image.png` 재사용.
- 메인 앱 진입 후의 UX (마일스톤, 지도 등).
