import type { BadgeDefinition } from "../../badges/badges";
import type { PremiumContext } from "./types";
import { evaluateAgeMatch } from "./evaluators/ageMatch";
import { evaluateCalendar } from "./evaluators/calendar";
import { evaluateFlagPalette } from "./evaluators/flagPalette";
import { evaluateUnLinguist } from "./evaluators/unLinguist";
import { evaluateShare } from "./evaluators/share";
import { evaluateRoundTheClock } from "./evaluators/roundTheClock";

export function evaluatePremiumBadges(ctx: PremiumContext): BadgeDefinition[] {
  return [
    ...evaluateAgeMatch(ctx),
    ...evaluateCalendar(ctx),
    ...evaluateFlagPalette(ctx),
    ...evaluateUnLinguist(ctx),
    ...evaluateShare(ctx),
    ...evaluateRoundTheClock(ctx),
  ];
}
