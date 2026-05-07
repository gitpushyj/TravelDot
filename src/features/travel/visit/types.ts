// 무료 사용자의 일별 사진 저장 한도. 추후 유료 tier 도입 시 함수로 분기.
export const PHOTO_LIMIT_PER_DAY = 5;

export type VisitPhotoInput = {
  id: string;
  countryCode: string;
  date: string; // YYYY-MM-DD
  localUri: string;
  source: "auto" | "manual";
  takenAt: number;
  deviceMake?: string | null;
  deviceModel?: string | null;
};

export type VisitNote = {
  id: string;
  countryCode: string;
  date: string; // YYYY-MM-DD
  body: string;
  createdAt: number;
  updatedAt: number;
};

export type YearSummary = {
  year: number;
  days: number;
  countries: number;
  monthly: number[]; // length 12, days per month
};

export type RecentTrip = {
  countryCode: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;
  days: number;
};

export type TripWithPhotos = RecentTrip & { photos: number };

export type TripPhoto = {
  id: string;
  countryCode: string;
  date: string;
  localUri: string;
  takenAt: number;
  source: "auto" | "manual";
};

export type VisitPhotoForReview = {
  id: string;
  countryCode: string;
  date: string;
  takenAt: number;
  deviceMake: string | null;
  deviceModel: string | null;
  deviceCheckedAt: number | null;
};
