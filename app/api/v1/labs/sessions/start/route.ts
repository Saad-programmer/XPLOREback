import { startSession } from '@/src/labs/api';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return Response.json(await startSession(request, body.gameId ?? 'linux'));
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
}
