import { createContext, useContext, type ReactNode } from "react";

import type { YearMode } from "./types";

export type AppNavCtx = {
  yearMode: YearMode;
  setYearMode: (m: YearMode) => void;
  activeCounts: Record<string, number>;
};

const AppCtx = createContext<AppNavCtx | null>(null);

export function AppCtxProvider({
  value,
  children,
}: {
  value: AppNavCtx;
  children: ReactNode;
}) {
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useAppCtx(): AppNavCtx {
  const v = useContext(AppCtx);
  if (!v) throw new Error("AppCtx not provided");
  return v;
}
