import type { NavigatorScreenParams } from "@react-navigation/native";

import type { RecentTrip } from "../features/travel/visitRepository";

export type YearMode = { kind: "all" } | { kind: "year"; year: number };

export type ImageDetailPhoto = {
  key: string;
  // MediaLibrary asset id 또는 DB photo id. 표시 시점에 ph:// → file://로 lazy
  // 해석할 때 키로 쓴다.
  id: string;
  uri: string;
  date: string;
};

export type MainTabParamList = {
  Home: undefined;
  AllCountries: undefined;
  AI: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  GamesHub: undefined;
  FlagQuiz: undefined;
  FlagQuizLeaderboard: undefined;
  TravelTrivia: undefined;
  TravelTriviaLeaderboard: undefined;
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
  Language: undefined;
  MapAppearance: undefined;
  Subscription: { returnToTab?: keyof MainTabParamList } | undefined;
  PremiumIntro: { returnToTab?: keyof MainTabParamList } | undefined;
  CountryMerge: { countryCode: string };
  ImageDetail: {
    photos: ImageDetailPhoto[];
    initialIndex: number;
    title: string;
    flag: string;
  };
};
