export type CountryRef = {
  code: string;
  name: string;
};

export type DotCell = {
  id: string;
  lat: number;
  lng: number;
  kind?: "grid" | "anchor";
  country?: string;
  name?: string;
  countries?: CountryRef[];
  visitCount?: number;
};

export type DotData = {
  gridSize: number;
  minLat: number;
  maxLat: number;
  count: number;
  dots: DotCell[];
};
