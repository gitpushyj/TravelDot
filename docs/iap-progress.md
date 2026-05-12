# IAP(인앱결제) 통합 진행 상황 — RevenueCat

**마지막 업데이트:** 2026-05-12
**대상 앱:** PixelTravel (Bundle ID: `com.gitpush.visitgrid`)

> 이 문서는 RC 결제 통합 작업이 어디까지 됐고, **본인이 직접 해야 하는 일이 뭔지**를 정리한 진행 상황 doc입니다. 변경이 있으면 이 doc도 갱신하세요.

---

## ✅ 완료된 것

### 코드 / 인프라 (Claude가 끝냄)
- `react-native-purchases ^10.1.0` 설치 + Expo CNG 호환
- [src/lib/revenuecat.ts](../src/lib/revenuecat.ts) — SDK 래퍼 (configure / identify / forget / purchase / restore)
- [App.tsx](../App.tsx) — 앱 시작 시 RC configure + auth user.id 변화에 logIn/logOut 동기화
- [subscriptionService.ts](../src/features/subscription/subscriptionService.ts) — RC purchasePackage + restoreSubscription
- [subscriptionStore.ts](../src/features/subscription/subscriptionStore.ts) — restore + 결제 직후 즉시 entitlement 반영(webhook 도착 전 깜빡임 방지)
- [usePlans.ts](../src/features/subscription/usePlans.ts) — RC Offerings에서 실가격 동적 로드 (fallback PLANS 유지)
- [SubscriptionScreen/RestoreLink.tsx](../src/screens/SubscriptionScreen/RestoreLink.tsx) — Apple 심사 필수 Restore 링크
- [plans.ts](../src/features/subscription/plans.ts) — Plan 정책 yearly/monthly, fallback 가격 $24.99/$5.99
- i18n ko/en에 `restore` + `perMonth` 키
- [Supabase Edge Function `revenuecat-webhook`](../supabase/functions/revenuecat-webhook/) — 작성/배포/secret 설정/curl 검증
- 앱 표시명 `TravelDot` → `PixelTravel` 리브랜드 (16 파일 + AI systemPrompt redeploy)

### Apple 측
- ✅ Apple Paid Apps 계약 승인 (5월 10일 활성화)
- ✅ App Store Connect에 PixelTravel 앱 등록 (Apple App ID: `6768038342`)
- ✅ Subscription Group `PixelTravel Premium` 생성
- ⚠️ Yearly subscription 등록 (Product ID `yearly`, **메타데이터/가격 누락 상태** — 아래 A1 진행 필요)

### RevenueCat 측
- ✅ 가입 + 이메일 인증
- ✅ iOS App `PixelTravel (App Store)` 등록 (Bundle: `com.gitpush.visitgrid`)
- ✅ Entitlement `TravelDot Premium` 생성 + product attach (yearly, monthly)
- ✅ Webhook URL + Authorization secret 등록 (Production + Sandbox)

---

## ✅ iOS critical path — 완료 (2026-05-12)

> A~D 모든 단계 처리됨. 아래는 참고용 원본.



### A. App Store Connect에서 (30~60분)

**A1. Yearly subscription 메타데이터 완성**
- 1년 완납 결제 → "사용 가능 여부 설정"
  - 판매 지역: 모든 국가 또는 한국 등
  - 가격: **$24.99 (Tier 25)** — 자국 통화는 Apple이 자동 환산
- 도입 특가 (가격 저장 후 활성화) → **7일 무료 체험** 추가
- 현지화: 최소 한국어 / 영어 (표시 이름 + 설명)

**A2. Monthly subscription 등록** (같은 그룹에 + 버튼)
- Product ID: **`monthly`** (RC와 정확히 일치 — 절대 변경 X)
- 가격: **$5.99 (Tier 6)**
- Introductory Offer 없음
- 현지화 (한/영)

**A3. Subscription Group `PixelTravel Premium` 자체 현지화** 추가

**A4. P8 In-App Purchase Key 발급** (5분)
- App Store Connect → **사용자 및 액세스** → **통합** 탭 → **App Store Server API → In-App Purchase** → **+**
- 이름: `RevenueCat-PixelTravel`
- 생성 → **`.p8` 다운로드** (1회만 가능, 분실 시 재발급)
- **Key ID** + **Issuer ID** 메모

### B. RevenueCat dashboard에서 (10분)

**B5. P8 업로드**
- Apps & providers → **PixelTravel (App Store)** → 페이지 위쪽 **In-app purchase key configuration**
- `.p8` 업로드 + Key ID + Issuer ID 입력 → Save

**B6. Product / Offering 매칭**
- Product catalog → Products → App Store에서 import (자동) 또는 + 수동
  - `yearly`, `monthly` 두 개 (App Store와 정확히 같은 ID)
- 각 product → "Attach entitlements" → **`TravelDot Premium`** 선택
- Offerings → Default offering → Packages가 yearly/monthly로 매칭되어있는지 확인

### C. 코드 — `.env` 갱신 (1분)

**C7. Production key 교체**
- RC dashboard → API keys → **PixelTravel (App Store)** 줄의 **Show key** → `appl_xxxxx...` 복사
- `~/dev/VisitGrid/.env`와 worktree `.env` 둘 다:
  ```
  EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxxxxxxxxxxxxxxxxxx
  ```
  (현재 `test_lJwRXJNgwMJKaBTEcdCmZDWdJOj` → 교체)

### D. 테스트 (30분)

**D8. Sandbox tester 생성**
- App Store Connect → 사용자 및 액세스 → **Sandbox Testers** → + (실 이메일 안 써도 OK)

**D9. iPhone 셋업**
- Settings → App Store → **Sandbox Account** → 위 계정 로그인

**D10. 실기기 빌드** (시뮬레이터는 IAP 동작 안 함!)
```bash
cd ~/dev/VisitGrid && npx expo run:ios --device
```

**D11~12. 결제 / 복원 / 해지 테스트**
- 결제 → Sandbox sheet → 가짜 카드 → entitlement active → SubscriptionScreen 자동 닫힘 확인
- AI 채팅 잠금 풀림 / Settings에 활성 구독 노출 확인
- 앱 재설치 → "구매 복원" 버튼 → 활성 구독 복원
- Settings → 구독 관리 deep link → Apple Sandbox 화면에서 해지 → EXPIRATION webhook 받고 tier=0 자동 갱신 확인

---

## 🤖 Android (병렬 진행 가능, 시간 걸림)

1. **Play Console 결제 프로필 + Merchant 계정** (한국 1~3일 승인)
2. Play Console → PixelTravel 앱 등록 (Package: `com.gitpush.visitgrid`)
3. 구독 → `yearly` / `monthly` 등록 (가격은 USD 기준, KRW 자동 환산)
4. **Service Account JSON 발급** → RC dashboard → Android App 추가 + JSON 업로드
5. `.env`의 `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_xxxxx` 갱신
6. Android 실기기 + License Tester 계정으로 테스트

---

## 🏁 출시 전 마지막 단계

- App Store Connect에 **첫 앱 빌드 제출** (TestFlight 우선 → 외부 테스트 → 정식 심사)
- ✅ Privacy Policy / Terms of Use URL 등록 (2026-05-12). **단, 앱 내 링크 노출은 미완 — 결제 화면 + Settings에 두 링크 버튼 추가 필요** (Apple 3.1.2, 심사 거절 사유 1순위)
- App Store Connect **한국 세금 양식 활성화** (현재 "대기 중" — 결제 동작은 OK, payout 받기 전 활성화 필요)

---

## 📌 중요 ID / 상수

| | |
|---|---|
| Bundle ID (iOS/Android) | `com.gitpush.visitgrid` |
| Apple App ID | `6768038342` |
| Apple Team ID | `27LS459HJ3` |
| RC Project ID | `96e50376` |
| RC Entitlement Identifier | `TravelDot Premium` (공백 포함, 코드 매칭) |
| RC iOS App ID | `app74c86c3260` |
| Supabase Edge Function | `revenuecat-webhook` |
| Webhook URL | `https://qbyrnsquazrcryfvetzs.supabase.co/functions/v1/revenuecat-webhook` |
| **Yearly 가격** | **$24.99** (Tier 25), 7일 무료 체험 |
| **Monthly 가격** | **$5.99** (Tier 6) |
| Save % (월간 대비 yearly) | 65% |

---

## 🚦 한 줄 요약

iOS만 보면 **A1~A3 → A4 → B5~B6 → C7 → D8~12** 다섯 단계, 약 1.5~2시간. 이거 마치면 실 결제 동작합니다. Android는 Play Console Merchant 승인(1~3일) 기다리는 동안 병렬 진행.
