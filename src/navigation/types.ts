import type { RecentTrip } from "../features/travel/visitRepository";

export type YearMode = { kind: "all" } | { kind: "year"; year: number };

export type RootStackParamList = {
  Main: undefined;
  AddTrip: undefined;
  Settings: undefined;
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
};
