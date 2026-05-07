import { supabase } from "../../lib/supabase";
import type { HomeCountry } from "../travel/homeCountryStorage";

import type { Gender, UserProfile } from "./profileStore";

type SaveInput = {
  userId: string;
  homeCountry: HomeCountry;
  profile: UserProfile;
};

// 재로그인/재설치 시 DB에서 가져오는 사용자 프로필. 미설정 필드는 null이므로
// 호출 측이 부분 진행 상태(예: 본국만 등록하고 종료)를 그대로 처리할 수 있다.
export type DbUserProfile = {
  homeCountryCode: string | null;
  homeCountryChanged: boolean;
  birthYear: number | null;
  birthMonth: number | null;
  birthDay: number | null;
  gender: Gender | null;
};

// public.users 행은 auth.users 트리거로 자동 생성되므로 update만 사용한다.
// home_country_name 컬럼은 drop 되었으므로 더 이상 쓰지 않는다.
export async function saveUserProfileToDb(input: SaveInput): Promise<void> {
  const { userId, homeCountry, profile } = input;
  const { error } = await supabase
    .from("users")
    .update({
      home_country_code: homeCountry.code,
      birth_year: profile.birthYear,
      birth_month: profile.birthMonth,
      birth_day: profile.birthDay,
      gender: profile.gender,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
  if (error) throw error;
}

export async function loadUserProfileFromDb(
  userId: string
): Promise<DbUserProfile | null> {
  const { data, error } = await supabase
    .from("users")
    .select(
      "home_country_code, home_country_changed, birth_year, birth_month, birth_day, gender"
    )
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    homeCountryCode: data.home_country_code ?? null,
    homeCountryChanged: data.home_country_changed === true,
    birthYear: data.birth_year ?? null,
    birthMonth: data.birth_month ?? null,
    birthDay: data.birth_day ?? null,
    gender: (data.gender as Gender | null) ?? null,
  };
}

// 본국 바꾸기는 계정당 1회만 허용된다. DB 우선으로 마크해 권리가 의도치 않게
// 소진되는 일을 막고, 실패하면 호출 측이 throw를 받아 변경 자체를 차단한다.
export async function markHomeCountryChangedInDb(
  userId: string,
  code: string
): Promise<void> {
  const { error } = await supabase
    .from("users")
    .update({
      home_country_code: code,
      home_country_changed: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
  if (error) throw error;
}
