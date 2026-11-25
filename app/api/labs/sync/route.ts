import { timingSafeEqual } from 'node:crypto';
import { jsonError, serviceClient } from '@/src/labs/supabase-server';

function isAuthorized(request: Request): boolean {
  const expected = process.env.LABS_XP_SYNC_SECRET;
  const supplied = request.headers.get('x-labs-sync-secret');
  if (!expected || !supplied) return false;
  const expectedBytes = Buffer.from(expected);
  const suppliedBytes = Buffer.from(supplied);
  return (
    expectedBytes.length === suppliedBytes.length && timingSafeEqual(expectedBytes, suppliedBytes)
  );
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'Invalid Labs sync secret.' }, { status: 401 });
  }

  const destination = process.env.XPLORE_API_URL;
  const destinationSecret = process.env.XPLORE_SYNC_SECRET;
  if (!destination || !destinationSecret) {
    return Response.json(
      { error: 'The Xplore sync destination is not configured.' },
      { status: 503 },
    );
  }

  const admin = serviceClient();
  const [badgesResult, xpResult] = await Promise.all([
    admin
      .from('labs_badge')
      .select('id,tenant_id,user_id,key,tier,label,metadata,awarded_at,sync_attempts')
      .is('synced_at', null)
      .lte('next_sync_at', new Date().toISOString())
      .order('awarded_at')
      .limit(100),
    admin
      .from('labs_xp_ledger')
      .select('id,tenant_id,user_id,amount,reason,label,created_at,sync_attempts')
      .is('synced_at', null)
      .lte('next_sync_at', new Date().toISOString())
      .order('created_at')
      .limit(100),
  ]);
  if (badgesResult.error) return jsonError(badgesResult.error);
  if (xpResult.error) return jsonError(xpResult.error);

  const badges = badgesResult.data ?? [];
  const xpEntries = xpResult.data ?? [];
  if (badges.length === 0 && xpEntries.length === 0) {
    return Response.json({ sent: 0 }, { headers: { 'cache-control': 'no-store' } });
  }

  try {
    const response = await fetch(destination, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${destinationSecret}`,
      },
      body: JSON.stringify({
        badges: badges.map((badge) => ({
          tenantId: badge.tenant_id,
          userId: badge.user_id,
          key: badge.key,
          tier: badge.tier,
          label: badge.label,
          metadata: badge.metadata,
          awardedAt: badge.awarded_at,
        })),
        xpEntries: xpEntries.map((entry) => ({
          tenantId: entry.tenant_id,
          userId: entry.user_id,
          amount: entry.amount,
          reason: entry.reason,
          label: entry.label,
          createdAt: entry.created_at,
          campaignId: null,
          awardedById: null,
        })),
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      await scheduleRetry(admin, badges, xpEntries);
      return Response.json(
        { error: `Xplore sync endpoint returned HTTP ${response.status}.` },
        { status: 502 },
      );
    }

    const syncedAt = new Date().toISOString();
    const [badgeUpdate, xpUpdate] = await Promise.all([
      badges.length
        ? admin
            .from('labs_badge')
            .update({ synced_at: syncedAt })
            .in(
              'id',
              badges.map((row) => row.id),
            )
        : Promise.resolve({ error: null }),
      xpEntries.length
        ? admin
            .from('labs_xp_ledger')
            .update({ synced_at: syncedAt })
            .in(
              'id',
              xpEntries.map((row) => row.id),
            )
        : Promise.resolve({ error: null }),
    ]);
    if (badgeUpdate.error) throw badgeUpdate.error;
    if (xpUpdate.error) throw xpUpdate.error;
    return Response.json(
      {
        sent: badges.length + xpEntries.length,
        badges: badges.length,
        xpEntries: xpEntries.length,
      },
      { headers: { 'cache-control': 'no-store' } },
    );
  } catch (error) {
    await scheduleRetry(admin, badges, xpEntries);
    return jsonError(error);
  }
}

async function scheduleRetry(
  admin: ReturnType<typeof serviceClient>,
  badges: { id: string; sync_attempts: number }[],
  xpEntries: { id: string; sync_attempts: number }[],
): Promise<void> {
  const retryAt = (attempts: number) =>
    new Date(Date.now() + Math.min(60 * 2 ** Math.min(attempts, 6), 3600) * 1000).toISOString();
  const updates = await Promise.all([
    ...badges.map((badge) =>
      admin
        .from('labs_badge')
        .update({
          sync_attempts: badge.sync_attempts + 1,
          next_sync_at: retryAt(badge.sync_attempts + 1),
        })
        .eq('id', badge.id),
    ),
    ...xpEntries.map((entry) =>
      admin
        .from('labs_xp_ledger')
        .update({
          sync_attempts: entry.sync_attempts + 1,
          next_sync_at: retryAt(entry.sync_attempts + 1),
        })
        .eq('id', entry.id),
    ),
  ]);
  const failed = updates.find((update) => update.error);
  if (failed?.error) throw failed.error;
}
