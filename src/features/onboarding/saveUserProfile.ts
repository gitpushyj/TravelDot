import { supabase } from "../../lib/supabase";
import type { HomeCountry } from "../travel/homeCountryStorage";

import type { UserProfile } from "./profileStore";

type SaveInput = {
  userId: string;
  homeCountry: HomeCountry;
  profile: UserProfile;
};

// public.users 행은 auth.users 트리거로 자동 생성되므로 update만 사용한다.
export async function saveUserProfileToDb(input: SaveInput): Promise<void> {
  const { userId, homeCountry, profile } = input;
  const { error } = await supabase
    .from("users")
    .update({
      home_country_code: homeCountry.code,
      home_country_name: homeCountry.name,
      birth_year: profile.birthYear,
      birth_month: profile.birthMonth,
      birth_day: profile.birthDay,
      gender: profile.gender,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
  if (error) throw error;
}
