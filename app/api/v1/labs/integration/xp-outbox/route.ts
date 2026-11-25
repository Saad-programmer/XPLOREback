import { acknowledgeXpOutbox, isXploreIntegrationRequestAuthorized, readXpOutbox } from '@/src/labs/integration';

export async function GET(request: Request) {
  if (!isXploreIntegrationRequestAuthorized(request)) {
    return Response.json({ error: 'Unauthorized integration request.' }, { status: 401 });
  }

  const limit = Number(new URL(request.url).searchParams.get('limit') ?? 50);
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
    return Response.json({ error: 'limit must be an integer from 1 to 100.' }, { status: 400 });
  }
  return Response.json(await readXpOutbox(limit), { headers: { 'cache-control': 'no-store' } });
}

export async function POST(request: Request) {
  if (!isXploreIntegrationRequestAuthorized(request)) {
    return Response.json({ error: 'Unauthorized integration request.' }, { status: 401 });
  }

  try {
    return Response.json(await acknowledgeXpOutbox(await request.json()), {
      headers: { 'cache-control': 'no-store' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid acknowledgement payload.';
    return Response.json({ error: message }, { status: 400 });
  }
}
