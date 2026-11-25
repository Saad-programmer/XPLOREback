import { WEEKLY_XP_CAP } from './types';

export function calculateXpAward(
  earnedXp: number,
  requestedXp: number,
  weeklyCap = WEEKLY_XP_CAP,
): { awardedXp: number; totalXp: number } {
  const cap = Math.min(WEEKLY_XP_CAP, Math.max(0, Math.floor(weeklyCap)));
  const current = Math.min(cap, Math.max(0, Math.floor(earnedXp)));
  const requested = Math.max(0, Math.floor(requestedXp));
  const awardedXp = Math.min(requested, cap - current);
  return { awardedXp, totalXp: current + awardedXp };
}
