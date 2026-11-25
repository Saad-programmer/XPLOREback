import { getMission } from '@/src/games/linux/content';
import { missionPassword } from '@/src/labs/mission-password';
import { authenticateLabsRequest, jsonError, serviceClient } from '@/src/labs/supabase-server';
import { z } from 'zod';

const requestSchema = z.object({ game: z.enum(['linux', 'sql', 'git', 'network']) });

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const identity = await authenticateLabsRequest(request);
    const { id } = await context.params;
    const parsedBody = requestSchema.safeParse(await request.json());
    if (!parsedBody.success)
      return Response.json({ error: parsedBody.error.message }, { status: 400 });
    const mission = parsedBody.data.game === 'linux' ? getMission(id) : undefined;
    if (!mission)
      return Response.json({ error: 'Mission not found for this game.' }, { status: 404 });

    const secret = process.env.LABS_HMAC_SECRET;
    if (!secret)
      return Response.json({ error: 'Labs mission signing is not configured.' }, { status: 503 });
    const admin = serviceClient();
    const [checkpointResult, progressResult] = await Promise.all([
      admin
        .from('labs_checkpoint')
        .select('*')
        .eq('user_id', identity.userId)
        .eq('mission_id', id)
        .maybeSingle(),
      admin.from('labs_progress').upsert(
        {
          user_id: identity.userId,
          game: parsedBody.data.game,
          current_mission_id: id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,game' },
      ),
    ]);
    if (checkpointResult.error) throw checkpointResult.error;
    if (progressResult.error) throw progressResult.error;
    const row = checkpointResult.data;
    const checkpoint = row
      ? {
          game: row.game,
          missionId: row.mission_id,
          state: row.state,
          hintsUsed: row.hints_used,
          attempts: row.attempts,
          startedAt: row.started_at,
          updatedAt: row.updated_at,
        }
      : null;
    return Response.json(
      {
        missionId: id,
        secrets: { password: missionPassword(secret, identity.userId, id) },
        checkpoint,
      },
      { headers: { 'cache-control': 'no-store' } },
    );
  } catch (error) {
    return jsonError(error);
  }
}
