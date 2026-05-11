import { getTripDb } from "../../travel/trip/tripDb";
import type { PremiumContext, PremiumPhoto } from "./types";

type Args = {
  homeCountryCode: string | null;
  visitedCountryCodes: string[];
};

export async function buildPremiumContext(args: Args): Promise<PremiumContext> {
  const photos = await loadAllPhotos();
  return {
    homeCountry: args.homeCountryCode,
    photos,
    visitedCountriesCount: args.visitedCountryCodes.length,
    visitedCountryCodes: args.visitedCountryCodes,
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
