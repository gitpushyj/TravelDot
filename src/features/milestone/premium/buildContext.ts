import type { UserProfile } from "../../onboarding/profileStore";
import { getTripDb } from "../../travel/trip/tripDb";
import { ageAtTimestamp } from "./ageUtils";
import type { PremiumContext, PremiumPhoto } from "./types";

type Args = {
  profile: UserProfile | null;
  homeCountryCode: string | null;
  visitedCountryCodes: string[];
  now: number;
};

export async function buildPremiumContext(args: Args): Promise<PremiumContext> {
  const birth = args.profile
    ? { year: args.profile.birthYear, month: args.profile.birthMonth, day: args.profile.birthDay }
    : null;
  const photos = await loadAllPhotos();
  const currentAge = birth ? ageAtTimestamp(args.now, birth) : null;
  return {
    birth,
    homeCountry: args.homeCountryCode,
    photos,
    visitedCountriesCount: args.visitedCountryCodes.length,
    visitedCountryCodes: args.visitedCountryCodes,
    currentAge: currentAge != null && currentAge >= 0 ? currentAge : null,
  };
}

async function loadAllPhotos(): Promise<PremiumPhoto[]> {
  const db = await getTripDb();
  const rows = await db.getAllAsync<{
    country_code: string;
    taken_at: number;
  }>(
    `SELECT country_code, taken_at FROM visit_photos WHERE deleted_at IS NULL`
  );
  return rows.map((r) => ({ countryCode: r.country_code, takenAtMs: r.taken_at }));
}
