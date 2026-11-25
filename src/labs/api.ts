import { z } from 'zod';
import { Prisma } from '../generated/labs-client';
import { labsDb } from './prisma';
import {
  awardWeeklyXpInTransaction,
  computeNextWeekStart,
  computeWeekStart,
  getWeeklyXp,
} from './xp';
import { resolvePlayerFromRequest } from './identity';
import { seedFallbackData } from './seed';

const gameEventPayloadSchema = z.object({
  eventId: z.string().min(1),
  gameId: z.string().min(1),
  levelId: z.string().optional(),
  sessionId: z.string().optional(),
  eventType: z.enum([
    'GAME_STARTED',
    'GAME_FINISHED',
    'LEVEL_STARTED',
    'LEVEL_COMPLETED',
    'SCORE_SUBMITTED',
    'PERSONAL_RECORD_IMPROVED',
    'GLOBAL_RECORD_BEATEN',
    'ACHIEVEMENT_UNLOCKED',
    'SESSION_HEARTBEAT',
    'SESSION_ENDED',
  ]),
  payload: z.record(z.string(), z.any()).default({}),
});

export async function ensureLabsData() {
  if (process.env.NODE_ENV === 'production') return;
  await seedFallbackData();
}

export async function getMe(request: Request) {
  await ensureLabsData();
  const playerId = await resolvePlayerFromRequest(request);
  const player = await labsDb.labsPlayer.findUnique({ where: { id: playerId } });
  if (!player) throw new Error('Player not found');

  const summary = await getWeeklyXp(player.id);
  const [lifetime, completedLevels, achievements, playtime, sessions, personalRecords, globalRecords] = await Promise.all([
    labsDb.xpAward.aggregate({ _sum: { awardedXp: true }, where: { playerId: player.id } }),
    labsDb.playerLevelProgress.count({ where: { playerId: player.id, completed: true } }),
    labsDb.playerAchievement.count({ where: { playerId: player.id } }),
    labsDb.gameSession.aggregate({ _sum: { verifiedDurationSeconds: true }, where: { playerId: player.id } }),
    labsDb.gameSession.findMany({ where: { playerId: player.id }, select: { gameId: true }, distinct: ['gameId'] }),
    labsDb.gameRecord.count({ where: { playerId: player.id, recordType: 'PERSONAL_BEST' } }),
    labsDb.gameRecord.count({ where: { playerId: player.id, recordType: 'GLOBAL_RECORD' } }),
  ]);

  return {
    playerId: player.id,
    displayName: player.displayName,
    weeklyXp: summary.weeklyXp,
    weeklyCap: summary.weeklyCap,
    remainingXp: summary.remainingXp,
    capReached: summary.capReached,
    lifetimeLabsXp: Number(lifetime._sum.awardedXp ?? 0),
    currentWeekStart: summary.weekStart,
    nextResetAt: computeNextWeekStart(),
    completedLevels,
    unlockedAchievements: achievements,
    activePlaytimeSeconds: playtime._sum.verifiedDurationSeconds ?? 0,
    gamesPlayed: sessions.length,
    personalRecords,
    globalRecords,
  };
}

export async function getGames(request: Request) {
  await ensureLabsData();
  await resolvePlayerFromRequest(request);
  return labsDb.gameDefinition.findMany({
    where: { enabled: true },
    include: { levels: true },
  });
}

export async function getPlayerProgress(request: Request, gameId: string) {
  await ensureLabsData();
  const playerId = await resolvePlayerFromRequest(request);
  const game = await labsDb.gameDefinition.findFirst({
    where: { OR: [{ id: gameId }, { slug: gameId }], enabled: true },
  });
  if (!game) throw new Error('Game is unavailable');
  const [progress, stats] = await Promise.all([
    labsDb.playerLevelProgress.findMany({
      where: { playerId, level: { gameId: game.id } },
      include: { level: true },
    }),
    labsDb.playerAchievement.findMany({
      where: { playerId, achievement: { gameId: game.id } },
      include: { achievement: true },
    }),
  ]);

  return {
    gameId: game.slug,
    completedLevels: progress.filter((entry) => entry.completed).length,
    levelProgress: progress,
    achievements: stats,
  };
}

export async function startSession(request: Request, gameId: string) {
  await ensureLabsData();
  const playerId = await resolvePlayerFromRequest(request);
  const game = await labsDb.gameDefinition.findUnique({ where: { id: gameId } })
    ?? await labsDb.gameDefinition.findUnique({ where: { slug: gameId } });
  if (!game || !game.enabled) throw new Error('Game is unavailable');
  const session = await labsDb.gameSession.create({
    data: {
      playerId,
      gameId: game.id,
      status: 'ACTIVE',
      lastHeartbeatAt: new Date(),
      activeDurationSeconds: 0,
      verifiedDurationSeconds: 0,
    },
  });
  return session;
}

export async function heartbeatSession(request: Request, id: string) {
  await ensureLabsData();
  const playerId = await resolvePlayerFromRequest(request);
  return labsDb.$transaction(async (tx) => {
    const sessions = await tx.$queryRaw<Array<{
      playerId: string;
      status: string;
      lastHeartbeatAt: Date;
      activeDurationSeconds: number;
      verifiedDurationSeconds: number;
    }>>`
      SELECT "playerId", "status", "lastHeartbeatAt", "activeDurationSeconds", "verifiedDurationSeconds"
      FROM "GameSession"
      WHERE "id" = ${id}
      FOR UPDATE
    `;
    const session = sessions[0];
    if (!session || session.playerId !== playerId) {
      throw new Error('Session not found or not owned by the player');
    }
    if (session.status !== 'ACTIVE') throw new Error('Session is not active');
    const now = new Date();
    const elapsedSeconds = Math.floor((now.getTime() - session.lastHeartbeatAt.getTime()) / 1000);
    if (elapsedSeconds < 20) throw new Error('Heartbeat is too early');
    if (elapsedSeconds > 90) throw new Error('Session heartbeat expired');
    const verifiedIncrement = Math.min(30, elapsedSeconds);
    return tx.gameSession.update({
      where: { id },
      data: {
        lastHeartbeatAt: now,
        activeDurationSeconds: session.activeDurationSeconds + verifiedIncrement,
        verifiedDurationSeconds: session.verifiedDurationSeconds + verifiedIncrement,
      },
    });
  });
}

export async function endSession(request: Request, id: string) {
  await ensureLabsData();
  const playerId = await resolvePlayerFromRequest(request);
  const session = await labsDb.gameSession.findUnique({ where: { id } });
  if (!session || session.playerId !== playerId) {
    throw new Error('Session not found or not owned by the player');
  }
  if (session.status !== 'ACTIVE') throw new Error('Session is not active');

  return labsDb.gameSession.update({
    where: { id },
    data: { status: 'ENDED', endedAt: new Date(), lastHeartbeatAt: new Date() },
  });
}

export async function ingestEvent(request: Request) {
  await ensureLabsData();
  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > 16_384) throw new Error('Event payload is too large');
  const payload = await request.json();
  const parsed = gameEventPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }

  const playerId = await resolvePlayerFromRequest(request);
  const existing = await labsDb.gameEvent.findUnique({ where: { eventId: parsed.data.eventId } });
  if (existing) {
    if (existing.playerId !== playerId) throw new Error('Event ID already belongs to another player');
    const awards = await labsDb.xpAward.findMany({ where: { eventId: existing.id } });
    return {
      ok: true,
      duplicate: true,
      eventId: existing.id,
      awards,
      verificationStatus: existing.validationStatus,
    };
  }
  const game = await labsDb.gameDefinition.findFirst({
    where: { OR: [{ id: parsed.data.gameId }, { slug: parsed.data.gameId }], enabled: true },
  });
  if (!game) throw new Error('Game is unavailable');
  const level = parsed.data.levelId
    ? await labsDb.gameLevel.findFirst({
        where: {
          OR: [{ id: parsed.data.levelId }, { levelKey: parsed.data.levelId }],
          gameId: game.id,
          enabled: true,
        },
      })
    : null;
  if (parsed.data.levelId && !level) throw new Error('Level is unavailable');
  const session = parsed.data.sessionId
    ? await labsDb.gameSession.findUnique({ where: { id: parsed.data.sessionId } })
    : null;
  if (
    parsed.data.eventType === 'LEVEL_COMPLETED' &&
    (!session || session.playerId !== playerId || session.gameId !== game.id || session.status !== 'ACTIVE')
  ) {
    throw new Error('Session is invalid or not owned by the player');
  }
  if (JSON.stringify(parsed.data.payload).length > 16_384) throw new Error('Event payload is too large');
  const completionMetrics =
    parsed.data.eventType === 'LEVEL_COMPLETED'
      ? {
          score: parsed.data.payload.score,
          duration: parsed.data.payload.durationSeconds,
          hints: parsed.data.payload.hintsUsed,
          mistakes: parsed.data.payload.mistakes ?? 0,
        }
      : null;
  if (completionMetrics) {
    const { score, duration, hints, mistakes } = completionMetrics;
    if (!Number.isSafeInteger(score) || Math.abs(Number(score)) > 1_000_000_000) {
      throw new Error('Score is outside allowed bounds');
    }
    if (!Number.isSafeInteger(duration) || Number(duration) < 1 || Number(duration) > 86_400) {
      throw new Error('Duration is outside allowed bounds');
    }
    if (
      !Number.isSafeInteger(hints) ||
      Number(hints) < 0 ||
      !Number.isSafeInteger(mistakes) ||
      Number(mistakes) < 0
    ) {
      throw new Error('Completion metrics are invalid');
    }
    if (!level) throw new Error('A completed level is required.');
  }

  try {
    return await labsDb.$transaction(async (tx) => {
      const event = await tx.gameEvent.create({
        data: {
          eventId: parsed.data.eventId,
          playerId,
          gameId: game.id,
          levelId: level?.id ?? null,
          sessionId: parsed.data.sessionId ?? null,
          eventType: parsed.data.eventType,
          payload: parsed.data.payload,
          validationStatus: 'UNVERIFIED',
        },
      });

      const awards = [];
      if (completionMetrics && level) {
        const score = Number(completionMetrics.score);
        const duration = Number(completionMetrics.duration);
        const hints = Number(completionMetrics.hints);
        const mistakes = Number(completionMetrics.mistakes);
        const levelId = level.id;
        const current = await tx.playerLevelProgress.findUnique({
          where: { playerId_levelId: { playerId, levelId } },
        });
        const hasPersonalBest =
          current?.bestScore == null ||
          (game.scoreDirection === 'HIGHER_IS_BETTER'
            ? score > current.bestScore
            : score < current.bestScore);
        const now = new Date();
        await tx.playerLevelProgress.upsert({
          where: { playerId_levelId: { playerId, levelId } },
          create: {
            playerId,
            levelId,
            completed: true,
            bestScore: score,
            bestTimeSeconds: duration,
            attempts: 1,
            firstCompletedAt: now,
            lastCompletedAt: now,
          },
          update: {
            completed: true,
            bestScore: hasPersonalBest ? score : current.bestScore,
            bestTimeSeconds: Math.min(duration, current?.bestTimeSeconds ?? duration),
            attempts: { increment: 1 },
            lastCompletedAt: now,
          },
        });

        if (hasPersonalBest) {
          await tx.gameRecord.upsert({
            where: {
              playerId_gameId_levelId_recordType: {
                playerId,
                gameId: game.id,
                levelId,
                recordType: 'PERSONAL_BEST',
              },
            },
            create: {
              playerId,
              gameId: game.id,
              levelId,
              recordType: 'PERSONAL_BEST',
              value: score,
              verificationStatus: 'UNVERIFIED',
            },
            update: { value: score, achievedAt: now, verificationStatus: 'UNVERIFIED' },
          });
          const personalBest = await tx.gameAchievementDefinition.findUnique({
            where: { gameId_key: { gameId: game.id, key: 'personal-best' } },
          });
          if (personalBest) {
            await tx.playerAchievement.createMany({
              data: [{ playerId, achievementId: personalBest.id, metadata: { levelId } }],
              skipDuplicates: true,
            });
          }

          const bestFromOtherPlayers = await tx.gameRecord.findFirst({
            where: {
              gameId: game.id,
              levelId,
              recordType: 'PERSONAL_BEST',
              playerId: { not: playerId },
            },
            orderBy: { value: game.scoreDirection === 'HIGHER_IS_BETTER' ? 'desc' : 'asc' },
          });
          const beatsOtherPlayers =
            !bestFromOtherPlayers ||
            (game.scoreDirection === 'HIGHER_IS_BETTER'
              ? score > bestFromOtherPlayers.value
              : score < bestFromOtherPlayers.value);
          if (beatsOtherPlayers && bestFromOtherPlayers) {
            await tx.gameRecord.upsert({
              where: {
                playerId_gameId_levelId_recordType: {
                  playerId,
                  gameId: game.id,
                  levelId,
                  recordType: 'GLOBAL_RECORD',
                },
              },
              create: {
                playerId,
                gameId: game.id,
                levelId,
                recordType: 'GLOBAL_RECORD',
                value: score,
                verificationStatus: 'UNVERIFIED',
              },
              update: { value: score, achievedAt: now, verificationStatus: 'UNVERIFIED' },
            });
          }
        }

        const completedCount = await tx.playerLevelProgress.count({
          where: { playerId, level: { gameId: game.id }, completed: true },
        });
        const achievementKeys = new Set<string>();
        if (completedCount === 1) achievementKeys.add('first-level-complete');
        if (completedCount >= 5) achievementKeys.add('first-five-levels');
        if (completedCount >= 10) achievementKeys.add('first-ten-levels');
        if (hints === 0) achievementKeys.add('no-hint-win');
        if (mistakes === 0) achievementKeys.add('no-mistake-win');

        for (const key of achievementKeys) {
          const achievement = await tx.gameAchievementDefinition.findUnique({
            where: { gameId_key: { gameId: game.id, key } },
          });
          if (!achievement) continue;
          const created = await tx.playerAchievement.createMany({
            data: [{ playerId, achievementId: achievement.id, metadata: { levelId, eventId: event.id } }],
            skipDuplicates: true,
          });
          if (created.count === 0 || achievement.baseXp === 0) continue;

          awards.push(
            await awardWeeklyXpInTransaction(tx, {
              playerId,
              gameId: game.id,
              eventId: event.id,
              achievementId: achievement.id,
              weekStart: computeWeekStart(),
              ruleKey: `achievement:${achievement.key}`,
              requestedXp: achievement.baseXp,
            }),
          );
        }
      }

      await tx.gameEvent.update({
        where: { id: event.id },
        data: { processedAt: new Date() },
      });
      return {
        ok: true,
        eventId: event.id,
        awards,
        verificationStatus: 'UNVERIFIED' as const,
      };
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const duplicate = await labsDb.gameEvent.findUnique({ where: { eventId: parsed.data.eventId } });
      if (duplicate?.playerId === playerId) {
        const awards = await labsDb.xpAward.findMany({ where: { eventId: duplicate.id } });
        return {
          ok: true,
          duplicate: true,
          eventId: duplicate.id,
          awards,
          verificationStatus: duplicate.validationStatus,
        };
      }
    }
    throw error;
  }
}

export async function getAchievements(request: Request) {
  await ensureLabsData();
  await resolvePlayerFromRequest(request);
  return labsDb.gameAchievementDefinition.findMany({ include: { game: true } });
}

export async function getPlayerAchievements(request: Request) {
  await ensureLabsData();
  const playerId = await resolvePlayerFromRequest(request);
  return labsDb.playerAchievement.findMany({
    where: { playerId },
    include: { achievement: true },
  });
}

export async function getXpSummary(request: Request) {
  return getMe(request);
}

export async function getXpHistory(request: Request) {
  await ensureLabsData();
  const playerId = await resolvePlayerFromRequest(request);
  return labsDb.xpAward.findMany({
    where: { playerId },
    orderBy: { createdAt: 'desc' },
    include: { game: true },
  });
}

export async function getWeeklyLeaderboard(request: Request) {
  await ensureLabsData();
  await resolvePlayerFromRequest(request);
  const weekStart = computeWeekStart();
  const rows = await labsDb.weeklyXpBalance.findMany({
    where: { weekStart },
    include: { player: true },
    orderBy: { earnedXp: 'desc' },
  });

  return rows.map((row) => ({
    playerId: row.playerId,
    displayName: row.player.displayName,
    weeklyXp: row.earnedXp,
  }));
}

export async function getLeaderboardForGame(request: Request, gameId: string) {
  await ensureLabsData();
  await resolvePlayerFromRequest(request);
  const game = await labsDb.gameDefinition.findFirst({
    where: { OR: [{ id: gameId }, { slug: gameId }], enabled: true },
  });
  if (!game) return [];

  const rows = await labsDb.playerLevelProgress.findMany({
    where: { level: { gameId: game.id }, completed: true, bestScore: { not: null } },
    include: { player: true, level: true },
  });

  return rows
    .sort((left, right) => {
      const scoreOrder = game.scoreDirection === 'HIGHER_IS_BETTER'
        ? (right.bestScore ?? 0) - (left.bestScore ?? 0)
        : (left.bestScore ?? 0) - (right.bestScore ?? 0);
      return scoreOrder || (left.bestTimeSeconds ?? Number.MAX_SAFE_INTEGER) - (right.bestTimeSeconds ?? Number.MAX_SAFE_INTEGER);
    })
    .map((row) => ({
      playerId: row.playerId,
      displayName: row.player.displayName,
      levelId: row.levelId,
      levelTitle: row.level.title,
      bestScore: row.bestScore ?? 0,
      bestTimeSeconds: row.bestTimeSeconds ?? 0,
      verificationStatus: 'UNVERIFIED' as const,
    }));
}

export async function getRecords(request: Request, gameId: string) {
  await ensureLabsData();
  const game = await labsDb.gameDefinition.findFirst({
    where: { OR: [{ id: gameId }, { slug: gameId }], enabled: true },
  });
  if (!game) return [];

  return labsDb.gameRecord.findMany({
    where: { gameId: game.id },
    include: { player: true, level: true },
    orderBy: { achievedAt: 'desc' },
  });
}
