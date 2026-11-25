import { getRecords } from '@/src/labs/api';

export async function GET(request: Request, { params }: { params: Promise<{ gameId: string }> }) {
  try {
    const { gameId } = await params;
    return Response.json(await getRecords(request, gameId));
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
}
