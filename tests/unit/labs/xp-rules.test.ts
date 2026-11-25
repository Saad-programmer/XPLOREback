import { describe, expect, it } from 'vitest';
import { calculateXpAward } from '@/src/labs/xp-rules';

describe('calculateXpAward', () => {
  it('awards requested XP while keeping the weekly total at or below 50', () => {
    expect(calculateXpAward(0, 15)).toEqual({ awardedXp: 15, totalXp: 15 });
    expect(calculateXpAward(45, 10)).toEqual({ awardedXp: 5, totalXp: 50 });
    expect(calculateXpAward(50, 10)).toEqual({ awardedXp: 0, totalXp: 50 });
  });

  it('never allows configuration or corrupt stored totals to raise the cap', () => {
    expect(calculateXpAward(2, 100, 500)).toEqual({ awardedXp: 48, totalXp: 50 });
    expect(calculateXpAward(70, 5, 50)).toEqual({ awardedXp: 0, totalXp: 50 });
  });

  it('normalizes negative and fractional values before calculating an award', () => {
    expect(calculateXpAward(-4, 3.8)).toEqual({ awardedXp: 3, totalXp: 3 });
    expect(calculateXpAward(11, -7)).toEqual({ awardedXp: 0, totalXp: 11 });
  });
});
