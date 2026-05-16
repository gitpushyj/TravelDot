// VisitGrid 커스텀 Firebase Analytics 이벤트 정의.
// 표준 이벤트(login/sign_up/screen_view/purchase/tutorial_*)는 tracking.ts의
// 전용 helper를 통해 직접 호출하고, 그 외 도메인 고유 이벤트만 여기에 모은다.
//
// 이벤트 이름 규칙:
//  - 영문 소문자 + underscore (Firebase 권장)
//  - 동사_명사 또는 명사_상태 형태로 통일
//  - 파라미터 값은 string/number/boolean만 사용 — 객체/배열은 평탄화해서 넘긴다.

import { setUserProperty, track } from "./tracking";

// 방문 국가 수를 버킷으로 환산. 분포가 long-tail이라 raw 값을 그대로
// user property에 넣으면 슬라이스가 너무 잘게 쪼개진다.
function bucketCountryCount(n: number): string {
  if (n <= 0) return "0";
  if (n <= 5) return "1-5";
  if (n <= 10) return "6-10";
  if (n <= 20) return "11-20";
  if (n <= 50) return "21-50";
  return "51+";
}

// ── User properties ────────────────────────────────────────────────────────

export function setHomeCountryProperty(countryCode: string | null) {
  setUserProperty("home_country", countryCode);
}

export function setLanguageProperty(language: string | null) {
  setUserProperty("app_language", language);
}

export function setSignupProviderProperty(provider: "google" | "apple" | null) {
  setUserProperty("signup_provider", provider);
}

export function setVisitedCountryBucketProperty(count: number) {
  setUserProperty("visited_country_bucket", bucketCountryCount(count));
}

export function setAllMilestoneVisibleProperty(visible: boolean) {
  setUserProperty("all_milestone_visible", visible ? "true" : "false");
}

// ── Auth ───────────────────────────────────────────────────────────────────

export function trackSigninAttempted(provider: "google" | "apple") {
  track("signin_attempted", { provider });
}

export function trackSigninFailed(params: {
  provider: "google" | "apple";
  cancelled: boolean;
  reason?: string;
}) {
  track("signin_failed", {
    provider: params.provider,
    cancelled: params.cancelled,
    // 에러 메시지는 100자 제한이 있어 잘라서 보낸다.
    reason: params.reason?.slice(0, 100),
  });
}

// 로그인 성공 자체는 Firebase 표준 `login` 이벤트로 처리한다(tracking.logLogin).
// 여기서는 우리 도메인이 직접 보고 싶은 부가 정보(콜드 스타트 vs 인앱)에 한해 보조 이벤트로 둔다.
export function trackSignedOut() {
  track("signed_out");
}

// ── Onboarding ─────────────────────────────────────────────────────────────

// step은 OnboardingFlow의 1..6 단계 번호.
export function trackOnboardingStepView(step: number, name: string) {
  track("onboarding_step_view", { step, name });
}

export function trackOnboardingCompleted(params: {
  homeCountry: string | null;
  durationMs: number;
  visitedCountryCount: number;
}) {
  track("onboarding_completed", {
    home_country: params.homeCountry,
    duration_ms: params.durationMs,
    visited_country_count: params.visitedCountryCount,
  });
}

// ── Visit / Trip ───────────────────────────────────────────────────────────

export function trackHomeCountryChanged(params: {
  from: string | null;
  to: string;
}) {
  track("home_country_changed", { from: params.from, to: params.to });
}

export function trackTripCreated(params: {
  countryCode: string;
  durationDays: number;
  source: "manual" | "photo_sync";
}) {
  track("trip_created", {
    country: params.countryCode,
    duration_days: params.durationDays,
    source: params.source,
  });
}

export function trackTripEdited(params: {
  countryCode: string;
  oldDurationDays: number;
  newDurationDays: number;
}) {
  track("trip_edited", {
    country: params.countryCode,
    old_duration_days: params.oldDurationDays,
    new_duration_days: params.newDurationDays,
  });
}

export function trackTripDeleted(params: {
  countryCode: string;
  durationDays: number;
  source: "manual" | "review_reject";
}) {
  track("trip_deleted", {
    country: params.countryCode,
    duration_days: params.durationDays,
    source: params.source,
  });
}

export function trackAllVisitsWiped() {
  track("all_visits_wiped");
}

// ── Photo sync ─────────────────────────────────────────────────────────────

export type PhotoSyncTrigger = "onboarding" | "incremental" | "manual_full";

export function trackPhotoSyncStarted(trigger: PhotoSyncTrigger) {
  track("photo_sync_started", { trigger });
}

export function trackPhotoSyncCompleted(params: {
  trigger: PhotoSyncTrigger;
  permission: "granted" | "limited" | "denied";
  scanned: number;
  withGps: number;
  resolved: number;
  added: number;
  durationMs: number;
}) {
  track("photo_sync_completed", {
    trigger: params.trigger,
    permission: params.permission,
    scanned: params.scanned,
    with_gps: params.withGps,
    resolved: params.resolved,
    added: params.added,
    duration_ms: params.durationMs,
  });
}

export function trackPhotoSyncFailed(params: {
  trigger: PhotoSyncTrigger;
  reason: string;
  durationMs: number;
}) {
  track("photo_sync_failed", {
    trigger: params.trigger,
    reason: params.reason.slice(0, 100),
    duration_ms: params.durationMs,
  });
}

// ── Milestone ──────────────────────────────────────────────────────────────

export function trackMilestoneKindChanged(kind: string) {
  track("milestone_kind_changed", { kind });
}

export function trackMilestoneTierReached(params: {
  kind: string;
  tier: string;
  current: number;
}) {
  track("milestone_tier_reached", {
    kind: params.kind,
    tier: params.tier,
    current: params.current,
  });
}

// ── Subscription / Paywall ─────────────────────────────────────────────────

export type PaywallSource =
  | "settings"
  | "premium_intro"
  | "milestones"
  | "ai_tab"
  | "feature_gate"
  | "unknown";

export function trackPaywallViewed(source: PaywallSource) {
  track("paywall_viewed", { source });
}

export function trackPaywallPlanSelected(params: {
  source: PaywallSource;
  plan: string;
}) {
  track("paywall_plan_selected", { source: params.source, plan: params.plan });
}

export function trackSubscribeAttempted(params: {
  source: PaywallSource;
  plan: string;
}) {
  track("subscribe_attempted", { source: params.source, plan: params.plan });
}

export function trackSubscribeFailed(params: {
  source: PaywallSource;
  plan: string;
  reason: string;
}) {
  track("subscribe_failed", {
    source: params.source,
    plan: params.plan,
    reason: params.reason.slice(0, 100),
  });
}

// 성공 시점은 Firebase 표준 `purchase` 이벤트(tracking.logPurchase)로 따로 발화한다.
// 이 이벤트는 우리 도메인이 "어디서 들어와 어떤 플랜으로 결제했는지" 슬라이스용.
export function trackSubscribeSucceeded(params: {
  source: PaywallSource;
  plan: string;
}) {
  track("subscribe_succeeded", { source: params.source, plan: params.plan });
}

export function trackRestoreAttempted() {
  track("restore_attempted");
}

export function trackRestoreResult(restored: boolean) {
  track("restore_result", { restored });
}

export function trackPremiumIntroViewed() {
  track("premium_intro_viewed");
}

export function trackPremiumIntroDismissed() {
  track("premium_intro_dismissed");
}

// ── AI Chat ────────────────────────────────────────────────────────────────

export function trackAiChatOpened() {
  track("ai_chat_opened");
}

export function trackAiMessageSent(params: {
  tier: string;
  messageLength: number;
  historyDepth: number;
}) {
  track("ai_message_sent", {
    tier: params.tier,
    message_length: params.messageLength,
    history_depth: params.historyDepth,
  });
}

export function trackAiMessageOutcome(params: {
  tier: string;
  // aiChat의 SendOutcome.kind와 일치.
  outcome:
    | "ok"
    | "rate_limited"
    | "network"
    | "invalid_input"
    | "upstream"
    | "unknown";
}) {
  track("ai_message_outcome", {
    tier: params.tier,
    outcome: params.outcome,
  });
}

export function trackAiChatCleared() {
  track("ai_chat_cleared");
}
