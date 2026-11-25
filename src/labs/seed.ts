import { labsDb } from './prisma';
import { getLocalDevelopmentPlayers } from './identity';
import { computeWeekStart } from './xp';

const builtInGames = [
  { slug: 'linux', title: 'Root Escape', description: 'Linux training missions', enabled: true, scoreDirection: 'LOWER_IS_BETTER' as const },
  { slug: 'sql', title: 'Seek & Command', description: 'SQL mini game', enabled: true, scoreDirection: 'HIGHER_IS_BETTER' as const },
  { slug: 'network', title: 'Next Hop', description: 'Networking challenge', enabled: true, scoreDirection: 'HIGHER_IS_BETTER' as const },
];

const linuxLevels = [
  ['wake-up-hello-world', 'Hello, world?'],
  ['wake-up-first-door', 'The first door'],
  ['archive-hidden-scroll', 'The hidden scroll'],
  ['archive-moving-day', 'Moving day'],
  ['archive-clean-up', 'Clean up, carefully'],
] as const;

async function ensurePlayers() {
  const players = getLocalDevelopmentPlayers();
  for (const player of players) {
    await labsDb.labsPlayer.upsert({
      where: { id: player.id },
      update: {
        displayName: player.displayName,
        avatarUrl: player.avatarUrl ?? null,
        externalXploreUserId: null,
      },
      create: {
        id: player.id,
        displayName: player.displayName,
        avatarUrl: player.avatarUrl ?? null,
        externalXploreUserId: player.externalXploreUserId ?? null,
      },
    });
  }
}

async function ensureGames() {
  for (const game of builtInGames) {
    await labsDb.gameDefinition.upsert({
      where: { slug: game.slug },
      update: { title: game.title, description: game.description, enabled: game.enabled },
      create: {
        slug: game.slug,
        title: game.title,
        description: game.description,
        enabled: game.enabled,
        scoreDirection: game.scoreDirection,
      },
    });
  }
}

async function ensureLevels() {
  const games = await labsDb.gameDefinition.findMany();
  for (const game of games) {
    const levels: ReadonlyArray<readonly [string, string]> = game.slug === 'linux'
      ? linuxLevels
      : [['level-1', `${game.title} 1`], ['level-2', `${game.title} 2`], ['level-3', `${game.title} 3`]];
    for (const [index, [levelKey, title]] of levels.entries()) {
      await labsDb.gameLevel.upsert({
        where: { gameId_levelKey: { gameId: game.id, levelKey } },
        update: { title, sequence: index + 1 },
        create: { gameId: game.id, levelKey, title, difficulty: 'beginner', sequence: index + 1 },
      });
    }
  }
}

async function ensureAchievements() {
  const games = await labsDb.gameDefinition.findMany();
  const defs: Array<[string, string, string, string, number]> = [
    ['first-level-complete', 'First level complete', 'Finish your first level in this game.', 'LEVEL_COMPLETION', 5],
    ['first-five-levels', 'Five levels complete', 'Finish five distinct levels in this game.', 'LEVEL_COMPLETION', 10],
    ['first-ten-levels', 'Ten levels complete', 'Finish ten distinct levels in this game.', 'LEVEL_COMPLETION', 15],
    ['no-hint-win', 'No hints needed', 'Finish a level without using a hint.', 'ENGAGEMENT', 5],
    ['no-mistake-win', 'Clean run', 'Finish a level without mistakes.', 'ENGAGEMENT', 5],
    ['personal-best', 'Personal best', 'Improve your best score on a level.', 'RECORD', 0],
  ];

  for (const game of games) {
    for (const [key, title, description, category, baseXp] of defs) {
      await labsDb.gameAchievementDefinition.upsert({
        where: { gameId_key: { gameId: game.id, key } },
        update: { title, description, category, baseXp, enabled: true },
        create: { gameId: game.id, key, title, description, category, baseXp, repeatPolicy: 'once', enabled: true },
      });
    }
  }
}

async function ensureSampleXp() {
  const players = getLocalDevelopmentPlayers();
  const weekStart = computeWeekStart();
  const byPlayer = {
    [players[0].id]: 0,
    [players[1].id]: 20,
    [players[2].id]: 46,
    [players[3].id]: 50,
  };

  for (const [playerId, xp] of Object.entries(byPlayer)) {
    await labsDb.weeklyXpBalance.upsert({
      where: { playerId_weekStart: { playerId, weekStart } },
      update: {},
      create: { playerId, weekStart, earnedXp: xp, capXp: 50 },
    });
  }
}

export async function seedLabsCatalog() {
  await ensureGames();
  await ensureLevels();
  await ensureAchievements();
}

export async function seedFallbackData() {
  await ensurePlayers();
  await seedLabsCatalog();
  await ensureSampleXp();
}
