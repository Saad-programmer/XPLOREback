import { z } from 'zod';
import { labsDb } from './prisma';
import type { PlayerIdentity } from './types';

export interface PlayerIdentityProvider {
  getAuthenticatedPlayer(request: Request): Promise<PlayerIdentity>;
}

const DEV_PLAYERS: PlayerIdentity[] = [
  { id: '00000000-0000-4000-8000-000000000001', displayName: 'Alice' },
  { id: '00000000-0000-4000-8000-000000000002', displayName: 'Bob' },
  { id: '00000000-0000-4000-8000-000000000003', displayName: 'Charlie' },
  { id: '00000000-0000-4000-8000-000000000004', displayName: 'Diana' },
  { id: '00000000-0000-4000-8000-000000000005', displayName: 'Eve' },
];

export const devPlayerSchema = z.object({
  id: z.string().uuid(),
  displayName: z.string(),
  externalXploreUserId: z.string().optional(),
});

const authenticatedUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().optional(),
  user_metadata: z.record(z.string(), z.unknown()).optional(),
  app_metadata: z.record(z.string(), z.unknown()).optional(),
});

export function getLocalDevelopmentPlayers(): PlayerIdentity[] {
  return DEV_PLAYERS;
}

export function resolvePlayerIdFromHeader(headerValue?: string | null): string | null {
  if (!headerValue) return null;
  const candidate = headerValue.trim();
  return candidate.length > 0 ? candidate : null;
}

export async function resolvePlayerFromRequest(request: Request): Promise<string> {
  if (process.env.NODE_ENV !== 'production' && process.env.LABS_AUTH_MODE !== 'supabase') {
    const allowedPlayers = new Set(DEV_PLAYERS.map(({ id }) => id));
    const headerPlayer = resolvePlayerIdFromHeader(request.headers.get('x-labs-player'));
    if (headerPlayer && allowedPlayers.has(headerPlayer)) return headerPlayer;
    return DEV_PLAYERS[0].id;
  }

  const authorization = request.headers.get('authorization');
  const accessToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!accessToken) throw new Error('Sign in with Xplore to access your Labs profile.');

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    throw new Error('Supabase authentication is not configured. Set SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }

  const response = await fetch(`${supabaseUrl.replace(/\/+$/, '')}/auth/v1/user`, {
    headers: {
      apikey: anonKey,
      authorization: `Bearer ${accessToken}`,
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error('Your Xplore session is invalid or has expired. Sign in again.');

  const parsedUser = authenticatedUserSchema.safeParse(await response.json());
  if (!parsedUser.success) throw new Error('Supabase returned an invalid authenticated user.');
  const user = parsedUser.data;
  const metadataName = user.user_metadata?.display_name ?? user.user_metadata?.full_name;
  const displayName =
    typeof metadataName === 'string' && metadataName.trim()
      ? metadataName.trim().slice(0, 80)
      : user.email?.split('@')[0] ?? 'Xplore player';
  const mappedXploreUserId = user.app_metadata?.xplore_user_id;
  if (typeof mappedXploreUserId === 'string' && !z.string().uuid().safeParse(mappedXploreUserId).success) {
    throw new Error('The Xplore user mapping in Supabase app metadata must be a UUID.');
  }

  const player = await labsDb.labsPlayer.upsert({
    where: { id: user.id },
    update: {
      displayName,
      externalXploreUserId: typeof mappedXploreUserId === 'string' ? mappedXploreUserId : null,
    },
    create: {
      id: user.id,
      displayName,
      externalXploreUserId: typeof mappedXploreUserId === 'string' ? mappedXploreUserId : null,
    },
    select: { id: true },
  });
  return player.id;
}
