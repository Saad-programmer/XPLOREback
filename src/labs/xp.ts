import { DateTime } from 'luxon';
import { z } from 'zod';
import type { Prisma } from '../generated/labs-client';
import { labsDb } from './prisma';
import { calculateXpAward } from './xp-rules';
import { XP_TIMEZONE, WEEKLY_XP_CAP } from './types';

export { calculateXpAward } from './xp-rules';

export function computeWeekStart(date: Date | string = new Date(), timeZone = XP_TIMEZONE): string {
  const dateTime = typeof date === 'string' ? DateTime.fromISO(date, { zone: timeZone }) : DateTime.fromJSDate(date, { zone: timeZone });
  const start = dateTime.startOf('week');
  return start.toISODate() ?? dateTime.toISODate() ?? '1970-01-05';
}

export function computeNextWeekStart(date: Date | string = new Date(), timeZone = XP_TIMEZONE): string {
  const dateTime = typeof date === 'string' ? DateTime.fromISO(date, { zone: timeZone }) : DateTime.fromJSDate(date, { zone: timeZone });
  return dateTime.startOf('week').plus({ weeks: 1 }).startOf('day').toISO() ?? '';
}

export const xpAwardRuleSchema = z.object({
  playerId: z.string().uuid(),
  gameId: z.string(),
  eventId: z.string().optional(),
  achievementId: z.string().optional(),
  weekStart: z.string(),
  ruleKey: z.string(),
  requestedXp: z.number().int().positive(),
});

export async function awardWeeklyXpInTransaction(
  tx: Prisma.TransactionClient,
  input: z.infer<typeof xpAwardRuleSchema>,
) {
  const { playerId, gameId, eventId, achievementId, weekStart, ruleKey, requestedXp } = input;
  const cap = WEEKLY_XP_CAP;

  const earningKey = `${playerId}:${weekStart}:${ruleKey}:${eventId ?? 'once'}`;
  const existing = await tx.xpAward.findUnique({ where: { earningKey } });
  if (existing) return existing;

  await tx.$executeRaw`
    INSERT INTO "WeeklyXpBalance" ("playerId", "weekStart", "earnedXp", "capXp", "updatedAt")
    VALUES (${playerId}, ${weekStart}, 0, ${cap}, NOW())
    ON CONFLICT ("playerId", "weekStart") DO NOTHING
  `;
  const balances = await tx.$queryRaw<Array<{ earnedXp: number; capXp: number }>>`
    SELECT "earnedXp", "capXp"
    FROM "WeeklyXpBalance"
    WHERE "playerId" = ${playerId} AND "weekStart" = ${weekStart}
    FOR UPDATE
  `;
  const balance = balances[0];
  if (!balance) throw new Error('Could not lock the player weekly XP balance.');

  const effectiveCap = Math.min(cap, balance.capXp, WEEKLY_XP_CAP);
  const { awardedXp, totalXp } = calculateXpAward(balance.earnedXp, requestedXp, effectiveCap);
  const award = await tx.xpAward.create({
    data: {
      playerId,
      gameId,
      eventId: eventId ?? null,
      achievementId: achievementId ?? null,
      earningKey,
      weekStart,
      ruleKey,
      requestedXp,
      awardedXp,
      status: requestedXp > awardedXp ? 'CAP_REACHED' : 'AWARDED',
      verificationStatus: 'UNVERIFIED',
    },
  });

  await tx.weeklyXpBalance.update({
    where: { playerId_weekStart: { playerId, weekStart } },
    data: { earnedXp: totalXp, capXp: effectiveCap },
  });

  if (awardedXp > 0) {
    const player = await tx.labsPlayer.findUnique({ where: { id: playerId } });
    if (!player) throw new Error('Cannot create an XP outbox item for an unknown player.');
    await tx.xpSyncOutbox.create({
      data: {
        awardId: award.id,
        playerId,
        externalUserId: player.externalXploreUserId,
        tenantId: process.env.LABS_TENANT_ID || null,
        amount: awardedXp,
        reason: ruleKey,
        verificationStatus: 'UNVERIFIED',
        idempotencyKey: `xplore-labs:${award.id}`,
        status: 'PENDING',
        attempts: 0,
        lastError: null,
      },
    });
  }

  return award;
}

export async function awardWeeklyXp(input: z.infer<typeof xpAwardRuleSchema>) {
  return labsDb.$transaction((tx) => awardWeeklyXpInTransaction(tx, input));
}

export async function getWeeklyXp(playerId: string) {
  const weekStart = computeWeekStart();
  const balance = await labsDb.weeklyXpBalance.findUnique({
    where: { playerId_weekStart: { playerId, weekStart } },
  });

  const total = balance?.earnedXp ?? 0;
  return {
    weekStart,
    weeklyXp: total,
    weeklyCap: WEEKLY_XP_CAP,
    remainingXp: Math.max(0, WEEKLY_XP_CAP - total),
    capReached: total >= WEEKLY_XP_CAP,
  };
}
