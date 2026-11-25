import { getXpSummary } from '@/src/labs/api';

export async function GET(request: Request) {
  try {
    return Response.json(await getXpSummary(request));
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
}
