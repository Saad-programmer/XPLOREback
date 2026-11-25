import { ingestEvent } from '@/src/labs/api';

export async function POST(request: Request) {
  try {
    return Response.json(await ingestEvent(request));
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
}
