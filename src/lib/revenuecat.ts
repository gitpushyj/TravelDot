// RevenueCat SDK 래퍼. Purchases.* 직접 호출은 이 파일을 통해서만 한다.
//
// API 키: EXPO_PUBLIC_REVENUECAT_IOS_KEY / _ANDROID_KEY (publishable, 클라이언트 노출 OK).
// Entitlement ID: RevenueCat 대시보드 > Entitlements 에서 만든 ID와 정확히 일치해야 한다.
//
// 키가 비어있으면 모든 함수는 no-op으로 동작해 dev 빌드에서 .env 미설정 시 크래시를 막는다.

import { Platform } from "react-native";
import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type LogInResult,
  type MakePurchaseResult,
  type PurchasesOffering,
  type PurchasesPackage,
} from "react-native-purchases";

import type { PlanId } from "../features/subscription/plans";

export const PREMIUM_ENTITLEMENT_ID = "premium";

const IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? "";
const ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? "";

function pickApiKey(): string {
  return (
    Platform.select({
      ios: IOS_KEY,
      android: ANDROID_KEY,
      default: "",
    }) ?? ""
  );
}

let configured = false;

export function isPurchasesConfigured(): boolean {
  return configured;
}

// 앱 시작 시 1회. 키가 없으면 경고만 남기고 no-op.
export async function configurePurchases(): Promise<void> {
  if (configured) return;
  const apiKey = pickApiKey();
  if (!apiKey) {
    console.warn(
      "[revenuecat] EXPO_PUBLIC_REVENUECAT_IOS_KEY / _ANDROID_KEY missing — IAP disabled."
    );
    return;
  }
  if (__DEV__) {
    await Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }
  Purchases.configure({ apiKey });
  configured = true;
}

// Supabase 로그인 직후. 같은 RC user_id로 로그인하면 영수증 히스토리가 머지된다.
export async function identifyPurchases(
  userId: string
): Promise<LogInResult | null> {
  if (!configured) return null;
  return Purchases.logIn(userId);
}

export async function forgetPurchases(): Promise<CustomerInfo | null> {
  if (!configured) return null;
  return Purchases.logOut();
}

export async function fetchCurrentOffering(): Promise<PurchasesOffering | null> {
  if (!configured) return null;
  const offerings = await Purchases.getOfferings();
  return offerings.current;
}

// PlanId → PurchasesPackage 매핑.
// 우선순위: RC 표준 슬롯(annual/monthly) → identifier 일치 fallback.
export function findPackageForPlan(
  offering: PurchasesOffering,
  plan: PlanId
): PurchasesPackage | null {
  if (plan === "yearly" && offering.annual) return offering.annual;
  if (plan === "monthly" && offering.monthly) return offering.monthly;
  return offering.availablePackages.find((p) => p.identifier === plan) ?? null;
}

export async function purchasePackageForPlan(
  plan: PlanId
): Promise<MakePurchaseResult> {
  if (!configured) {
    throw new Error("[revenuecat] not configured");
  }
  const offering = await fetchCurrentOffering();
  if (!offering) {
    throw new Error("[revenuecat] no current offering");
  }
  const pkg = findPackageForPlan(offering, plan);
  if (!pkg) {
    throw new Error(`[revenuecat] no package for plan=${plan}`);
  }
  return Purchases.purchasePackage(pkg);
}

export async function restorePurchases(): Promise<CustomerInfo | null> {
  if (!configured) return null;
  return Purchases.restorePurchases();
}

export function hasActivePremium(customerInfo: CustomerInfo): boolean {
  return Boolean(customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID]);
}
