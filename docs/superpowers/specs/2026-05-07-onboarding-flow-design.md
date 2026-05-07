# 온보딩 플로우 설계

작성일: 2026-05-07

## 배경

현재 신규 사용자는 다음 순서로 흩어진 화면을 만난다.

1. 미로그인 → `LoginScreen`
2. 로그인 후 본국 미설정 → `OnboardingScreen` (CountryPicker)
3. 본국 설정 후 사진 미스캔 → `InitialScanScreen` (스캔 + 의심 여행 정리)

각 화면은 별개 분기로 노출되며 진척 표시가 없고 시작/도착이 어디인지 사용자에게 보이지 않는다. 이 문서는 이 단계들을 5단계 진행률 바 기반의 통합 온보딩 플로우로 묶는 설계를 정의한다.

## 목표

- 처음 앱을 켜는 사용자에게 5단계 progress bar가 있는 친화적 온보딩을 보여준다.
- 단계: Welcome → Login → Home country → Sync → Suspect trip review.
- 한 번이라도 온보딩을 끝낸 사용자(앱 캐시)는 다음 실행부터 바로 메인으로 진입한다.
- 기존 사용자(이미 로그인 + 본국 설정 완료) 무중단 — 자동으로 완료 처리.

## 비목표

- 본국 변경 플로우(`OnboardingScreen` `mode="change"`) 재설계는 본 작업 범위 밖.
- 백그라운드 스캔 후 `InitialScanScreen` 노출(본국 변경 직후) 경로는 그대로 둔다.
- 디자인 시스템·테마 추가 — 기존 `theme/` 토큰 재사용.

## 진입 조건

App.tsx 분기는 다음과 같이 바뀐다.

```
hydrate 완료 후
└─ onboardingCompleted == true            → 메인 (RootNavigator)
└─ onboardingCompleted == false
   ├─ auth.user 있음 && homeCountry 있음
   │   → markCompleted() 후 메인 (기존 사용자 무중단)
   └─ 그 외                                → OnboardingFlow
```

`onboardingCompleted` 키: `visitgrid:onboarding:completed_v1` (AsyncStorage).

## 상태 모델

### 신규: `src/features/onboarding/onboardingStore.ts` (zustand)

```ts
type State = {
  hydrated: boolean;
  completed: boolean;
  hydrate(): Promise<void>;
  markCompleted(): Promise<void>;
};
```

- AsyncStorage 키: `visitgrid:onboarding:completed_v1`.
- 다른 store와 동일하게 App.tsx에서 `void hydrate()` 후 `hydrated` true가 되어야 분기 시작.

### 기존 store 재사용

| Step | 신호 source |
|------|-------------|
| 2 → 3 | `useAuthStore.user` |
| 3 → 4 | `useVisitStore.homeCountry` |
| 4 progress | `useVisitStore.syncStatus`, `lastSync` |
| 5 | `useVisitStore.suspectTrips` |

## 디렉터리 구조

```
src/screens/Onboarding/
├─ index.tsx              # OnboardingFlow: step state, progress bar, switcher
├─ OnboardingProgress.tsx # 단순 가로 텍도우 형 바
├─ WelcomeStep.tsx
├─ LoginStep.tsx
├─ HomeCountryStep.tsx
├─ SyncStep.tsx
├─ SuspectTripsStep.tsx
└─ styles.ts              # 공통 스타일 (헤더, 푸터, 버튼)
```

각 파일은 단일 책임. 기존 컨벤션(`src/screens/MainScreen/`, `src/screens/HistoryScreen/`)과 일치.

## OnboardingFlow (index.tsx)

- `step: 1 | 2 | 3 | 4 | 5` 로컬 state.
- 마운트 시 자동 skip:
  - step ≥ 2 도달 시 `auth.user` 이미 있으면 → 즉시 step 3
  - step ≥ 3 도달 시 `homeCountry` 이미 있으면 → 즉시 step 4
- step 4의 sync는 사용자 액션 필요(자동 skip 없음).
- 시스템 back: `BackHandler`로 차단(편도). 화면 내 "이전" 버튼도 없음.
- 모든 step 위에 항상 `OnboardingProgress` 노출.

## OnboardingProgress

- 단순 가로 바, 트랙(어두운 배경) + 채워지는 막대(`theme.accent`).
- `value = step / 5`, 부드러운 전환을 위해 `Animated.timing` (200ms ease).
- 좌우 양 끝에 작은 padding, step 텍스트는 표기하지 않는다(요청에 따라 단순 텍도우 형).

## Step 1 — Welcome

- 큰 SVG 아이콘 1개 (지구·사진 모티브, 단색 라인).
- 제목: "사진으로 그리는 여행 기록"
- 3줄 설명(아이콘 + 텍스트 한 줄씩):
  1. 휴대폰 사진의 GPS 정보로 어디를 다녀왔는지 자동으로 알아차려요
  2. 직접 입력 없이 여행이 정리되고 지도가 채워져요
  3. 사진은 휴대폰 밖으로 나가지 않아 안전해요
- 하단 "다음" 버튼 → step 2.

## Step 2 — Login

- 기존 `LoginScreen`의 시각 요소를 그대로 가져온 wrapper(브랜드 + Google 버튼). progress bar가 위에 있으므로 padding 조정.
- `useAuthStore.signInGoogle()` 호출 후 성공 시(상태 변화 감지) 자동 step 3.
- 취소/실패 시 기존 로직 그대로(Alert).

## Step 3 — Home country

- 기존 `OnboardingScreen` 본국 선택 UI(`CountryPicker`)를 step wrapper로 흡수.
- 헤더 카피:
  - 제목: "본국을 골라주세요"
  - 부제: "본국 도트는 일수와 무관하게 파란색으로 표시됩니다.\n외국은 방문 일수만큼 색상이 진해져요."
- 선택 → `setHomeCountry` → 자동 step 4.

## Step 4 — Sync

phase: `idle` → `requesting` → `syncing` → 자동 전환

- **idle**
  - 제목: "여행 기록을 동기화할게요"
  - 강조 안내 박스: "원활한 자동 기록을 위해 *전체 사진 접근 허용*을 선택해 주세요"
  - 큰 "동기화 하기" 버튼
- **requesting / syncing**
  - 동일 화면에 ActivityIndicator + "사진 N장 확인 중..." 진행 표시
  - `runFullSync()` 호출. `useVisitStore.syncStatus.processed` 폴링.
  - 권한이 `limited`인 경우 진행 표시 아래에 작은 회색 안내 텍스트:
    "선택한 사진만 분석되고 있어요. 더 많은 여행을 찾으려면 설정에서 전체 허용으로 변경할 수 있어요."
- 권한이 `denied`인 경우
  - 진행 불가. "사진 접근 권한이 필요해요" + "권한 다시 요청" 버튼만 노출.
  - 다시 요청해도 denied면 동일 상태 유지(설정 안내 추가 없음 — 사용자 결정).
- `lastSync`가 채워지면 → 자동 step 5.

## Step 5 — Suspect trips

- 기존 `InitialScanScreen`의 후반 UI(`SuspectRow` 리스트) 재활용.
- 케이스
  - `suspectTrips.length > 0` → 리스트 + 하단 "남은 여행은 모두 내 여행" 버튼
  - `suspectTrips.length === 0` → 안내 카피 + "홈으로 이동하기" 버튼
- 두 케이스 모두 마지막 액션은 동일:
  1. `acceptSuspectTrips(trips)` (있다면)
  2. `setLastSync(null)`
  3. `useOnboardingStore.markCompleted()`
- App.tsx가 다음 렌더에서 메인으로 전환.

## 기존 코드 영향

| 파일 | 변경 |
|------|------|
| `App.tsx` | `pendingInitialScan` / `!homeCountry` 분기를 OnboardingFlow 진입으로 대체. `useOnboardingStore.hydrate` 추가. |
| `src/screens/LoginScreen.tsx` | 그대로 둔다. 온보딩 완료 후 로그아웃·재로그인 케이스에서 계속 사용. |
| `src/screens/OnboardingScreen.tsx` | `mode="change"` 경로는 그대로(본국 변경에서 사용). `mode="initial"` 경로는 호출자가 사라져 dead path가 되지만, 본 작업에서는 그대로 둔다. |
| `src/screens/InitialScanScreen.tsx` | 그대로 둔다. 본국 변경 후 백그라운드 스캔 알림 등에서 계속 사용. |

## i18n

각 step 카피는 `src/i18n/locales/ko.json`, `en.json`에 우선 추가한다(나머지 언어는 영문 폴백). 키 네임스페이스: `onboarding.*`.

예:
```
onboarding.welcome.title
onboarding.welcome.point1 / point2 / point3
onboarding.welcome.next
onboarding.login.title
onboarding.home.title / subtitle
onboarding.sync.title / fullAccessHint / button / scanning / limitedHint / permissionDenied / requestAgain
onboarding.suspect.allCleared / goHome / acceptAll
```

## 테스트·검증 시나리오

수동 검증으로 충분(자동 테스트 인프라 없음).

1. 신규 사용자 — 5단계가 순서대로 노출되고 progress bar가 채워진다.
2. 이미 로그인된 상태로 앱 재설치(세션 복원) — step 2 자동 skip되어 step 3부터 시작.
3. step 3 진입 후 앱 강제종료·재실행 — 다시 OnboardingFlow에 진입하되 자동 skip으로 step 4부터(이미 homeCountry 저장됨) 시작.
4. step 4에서 권한 denied — "권한 다시 요청"만 노출되고 진행 불가.
5. step 4에서 limited 선택 — 진행되며 작은 안내 텍스트 노출.
6. step 5에서 의심 없음 — "홈으로 이동하기" 동작.
7. 기존 사용자(로그인 + homeCountry 모두 있음) — 첫 실행에서 OnboardingFlow가 보이지 않고 메인 진입, `onboardingCompleted` 자동 저장.
8. 본국 변경(설정 → 본국 변경) — 기존 동작 그대로(`OnboardingScreen` `mode="change"`, `InitialScanScreen` 백그라운드 스캔).

## 오픈 이슈

- Welcome step 아이콘은 SVG 자산 1개를 새로 추가해야 한다. 기존 `react-native-svg`로 단순 라인 일러스트를 인라인 컴포넌트로 작성한다(별도 자산 파일 없이).
- progress bar 애니메이션은 `react-native-reanimated`(이미 사용 중) 또는 RN 기본 `Animated` 중 후자로 충분하다.
