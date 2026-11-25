import { jsonError } from '@/src/labs/supabase-server';

/**
 * TODO: integrate the real Xplore session verifier and Supabase Admin token
 * generation after the Xplore login/session endpoint is confirmed.
 * Keep that provider isolated in getXploreSession(); never accept identity
 * claims supplied by the browser.
 */
async function getXploreSession(_request: Request): Promise<never> {
  void _request;
  throw new Response('Xplore session exchange is not configured yet.', { status: 501 });
}

export async function POST(request: Request) {
  try {
    return Response.json(await getXploreSession(request));
  } catch (error) {
    return jsonError(error);
  }
}
