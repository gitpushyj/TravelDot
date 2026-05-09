import type { RecentTrip } from "../features/travel/visitRepository";

export type YearMode = { kind: "all" } | { kind: "year"; year: number };

export type ImageDetailPhoto = {
  key: string;
  uri: string;
  date: string;
};

export type MainTabParamList = {
  Home: undefined;
  AI: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Main: undefined;
  AddTrip: { prefilledCountry?: { code: string; name: string } } | undefined;
  ChangeHome: undefined;
  Titles: undefined;
  Milestones: undefined;
  MapZoom: undefined;
  CountryDetail: undefined;
  TripDetail: { trip: RecentTrip };
  EditTrip: { trip: RecentTrip };
  History: undefined;
  ReviewSuspect: undefined;
  AllCountries: undefined;
  Language: undefined;
  CountryMerge: { countryCode: string };
  ImageDetail: {
    photos: ImageDetailPhoto[];
    initialIndex: number;
    title: string;
    flag: string;
  };
};
