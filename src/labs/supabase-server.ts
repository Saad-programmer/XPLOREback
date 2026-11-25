import 'server-only';

import { createClient, type User } from '@supabase/supabase-js';
import { z } from 'zod';

const uuidSchema = z.string().uuid();

export interface LabsRequestIdentity {
  userId: string;
  tenantId: string;
  user: User;
}

function decodeClaims(token: string): Record<string, unknown> {
  try {
    const payload = token.split('.')[1];
    if (!payload) return {};
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Record<
      string,
      unknown
    >;
  } catch {
    return {};
  }
}

export function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase server credentials are not configured.');
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export async function authenticateLabsRequest(request: Request): Promise<LabsRequestIdentity> {
  const authorization = request.headers.get('authorization');
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) throw new Response('Sign in to Xplore before using Labs.', { status: 401 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey)
    throw new Response('Supabase authentication is not configured.', { status: 503 });
  const authClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user)
    throw new Response('Your Xplore session is invalid or has expired.', { status: 401 });

  const claims = decodeClaims(token);
  const userId = uuidSchema.safeParse(claims.xplore_user_id);
  const tenantId = uuidSchema.safeParse(claims.tenant_id);
  if (!userId.success || !tenantId.success) {
    throw new Response('Your Xplore token is missing a valid user or tenant claim.', {
      status: 403,
    });
  }
  return { userId: userId.data, tenantId: tenantId.data, user: data.user };
}

export function jsonError(error: unknown): Response {
  if (error instanceof Response) return error;
  const message = error instanceof Error ? error.message : 'Unexpected Labs backend error.';
  return Response.json(
    { error: message },
    { status: 500, headers: { 'cache-control': 'no-store' } },
  );
}
