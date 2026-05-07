import AsyncStorage from "@react-native-async-storage/async-storage";

import { isMilestoneKind, MilestoneKind } from "./milestoneTypes";

const KIND_KEY = "visitgrid:milestone:kind";

export async function loadMilestoneKind(): Promise<MilestoneKind | null> {
  const v = await AsyncStorage.getItem(KIND_KEY);
  return isMilestoneKind(v) ? v : null;
}

export async function saveMilestoneKind(kind: MilestoneKind): Promise<void> {
  await AsyncStorage.setItem(KIND_KEY, kind);
}
