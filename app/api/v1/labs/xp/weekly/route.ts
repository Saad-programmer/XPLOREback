import { getWeeklyXp } from '@/src/labs/xp';
import { resolvePlayerFromRequest } from '@/src/labs/identity';

export async function GET(request: Request) {
  try {
    const playerId = await resolvePlayerFromRequest(request);
    return Response.json(await getWeeklyXp(playerId));
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
}
