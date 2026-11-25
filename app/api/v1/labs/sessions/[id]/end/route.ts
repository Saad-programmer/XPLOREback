import { endSession } from '@/src/labs/api';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return Response.json(await endSession(request, id));
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
}
