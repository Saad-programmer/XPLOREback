import { timingSafeEqual } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getMission } from '@/src/games/linux/content';
import { createShell } from '@/src/games/linux/engine/shell';
import { missionPassword } from '@/src/labs/mission-password';
import {
  emptyProgress,
  solutionOf,
  type GameId,
  type GameProgress,
  type MissionResult,
} from '@/src/shared/bridge/types';
import { authenticateLabsRequest, jsonError, serviceClient } from '@/src/labs/supabase-server';
import { z } from 'zod';

const statsSchema = z.object({
  hintsUsed: z.number().int().min(0).max(10_000),
  attempts: z.number().int().min(1).max(10_000),
  timeS: z.number().int().min(0).max(31_536_000),
  shortestCmdLen: z.number().int().min(0).max(10_000).nullable(),
  commands: z.array(z.string().max(200)).min(1).max(500),
});
const bodySchema = z.object({
  game: z.enum(['linux', 'sql', 'git', 'network']),
  answer: z.string().max(200).nullable(),
  stats: statsSchema,
});
function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left.trim());
  const b = Buffer.from(right.trim());
  return a.length === b.length && timingSafeEqual(a, b);
}

async function readProgress(
  admin: SupabaseClient,
  userId: string,
  game: GameId,
): Promise<GameProgress> {
  const [progressResult, missionsResult, unlocksResult] = await Promise.all([
    admin
      .from('labs_progress')
      .select('current_mission_id,total_points')
      .eq('user_id', userId)
      .eq('game', game)
      .maybeSingle(),
    admin.from('labs_mission_result').select('*').eq('user_id', userId).eq('game', game),
    admin.from('labs_unlock').select('item_type,item_id,unlocked_at').eq('user_id', userId),
  ]);
  if (progressResult.error) throw progressResult.error;
  if (missionsResult.error) throw missionsResult.error;
  if (unlocksResult.error) throw unlocksResult.error;

  return {
    ...emptyProgress(game),
    currentMissionId: progressResult.data?.current_mission_id ?? null,
    totalPoints: progressResult.data?.total_points ?? 0,
    missions: Object.fromEntries(
      (missionsResult.data ?? []).map((row): [string, MissionResult] => [
        row.mission_id,
        {
          status: row.status,
          bestScore: row.best_score,
          hintsUsed: row.hints_used,
          attempts: row.attempts,
          bestTimeS: row.best_time_s,
          shortestCmdLen: row.shortest_cmd_len,
          solution: Array.isArray(row.solution)
            ? row.solution.filter((line: unknown): line is string => typeof line === 'string')
            : undefined,
          firstCompletedAt: row.first_completed_at,
        },
      ]),
    ),
    unlocks: (unlocksResult.data ?? []).map((row) => ({
      itemType: row.item_type,
      itemId: row.item_id,
      unlockedAt: row.unlocked_at,
    })),
  };
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const identity = await authenticateLabsRequest(request);
    const { id } = await context.params;
    const parsedBody = bodySchema.safeParse(await request.json());
    if (!parsedBody.success)
      return Response.json({ error: parsedBody.error.message }, { status: 400 });
    const { game, answer, stats } = parsedBody.data;
    const mission = game === 'linux' ? getMission(id) : undefined;
    if (!mission)
      return Response.json({ error: 'Mission not found for this game.' }, { status: 404 });

    const admin = serviceClient();
    const { data: submissionId, error: submissionError } = await admin.rpc(
      'labs_register_submission',
      {
        p_user: identity.userId,
        p_mission_id: id,
      },
    );
    if (submissionError) {
      const status = submissionError.code === '54000' ? 429 : 500;
      return Response.json({ error: submissionError.message }, { status });
    }
    const unsuccessful = async () =>
      Response.json({
        success: false,
        pointsAwarded: 0,
        firstCompletion: false,
        stickers: [],
        progress: await readProgress(admin, identity.userId, game),
      });

    const secret = process.env.LABS_HMAC_SECRET;
    if (!secret)
      return Response.json({ error: 'Labs mission signing is not configured.' }, { status: 503 });
    const password = missionPassword(secret, identity.userId, id);
    if (mission.goal.type === 'password' && (!answer || !safeEqual(answer, password))) {
      return unsuccessful();
    }

    const shell = createShell({
      filesystem: mission.filesystem,
      startDir: mission.start_dir,
      user: mission.user,
      goal: mission.goal,
      missionId: id,
      secrets: { password },
      lang: 'en',
    });
    for (const command of stats.commands) shell.run(command);
    if (answer !== null) shell.submitAnswer(answer);
    if (!shell.isGoalReached()) return unsuccessful();

    const { data, error } = await admin.rpc('labs_submit_mission', {
      p_submission: submissionId,
      p_user: identity.userId,
      p_tenant: identity.tenantId,
      p_game: game,
      p_mission_id: id,
      p_stats: {
        hintsUsed: stats.hintsUsed,
        attempts: stats.attempts,
        timeS: stats.timeS,
        shortestCmdLen: stats.shortestCmdLen,
        score: mission.rewards.points + (stats.hintsUsed === 0 ? mission.rewards.no_hint_bonus : 0),
        solution: solutionOf(stats.commands),
      },
    });
    if (error) {
      const status = error.code === '54000' ? 429 : error.code === '22023' ? 400 : 500;
      return Response.json({ error: error.message }, { status });
    }

    const result = data as {
      success: boolean;
      firstCompletion: boolean;
      pointsAwarded: number;
      badges: { key: string; xp: number; capped: boolean }[];
      weekXp: { used: number; cap: number };
    };
    const catalogKeys = result.badges.map((badge) => badge.key);
    const { data: catalog, error: catalogError } = catalogKeys.length
      ? await admin.from('labs_badge_catalog').select('key,label,tier').in('key', catalogKeys)
      : { data: [], error: null };
    if (catalogError) throw catalogError;
    const details = new Map((catalog ?? []).map((badge) => [badge.key, badge]));
    return Response.json(
      {
        success: result.success,
        pointsAwarded: result.pointsAwarded,
        firstCompletion: result.firstCompletion,
        stickers: [],
        progress: await readProgress(admin, identity.userId, game),
        badges: result.badges.map((badge) => ({
          ...badge,
          label: details.get(badge.key)?.label ?? badge.key,
          tier: details.get(badge.key)?.tier ?? 'BRONZE',
        })),
        weekXp: result.weekXp,
      },
      { headers: { 'cache-control': 'no-store' } },
    );
  } catch (error) {
    return jsonError(error);
  }
}
