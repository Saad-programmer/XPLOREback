import { getGames } from '@/src/labs/api';

export async function GET(request: Request) {
  try {
    return Response.json(await getGames(request), { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
}
