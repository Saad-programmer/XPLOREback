import { timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { labsDb } from './prisma';

const acknowledgementSchema = z.object({
  results: z.array(
    z.object({
      outboxId: z.string().uuid(),
      status: z.enum(['SYNCED', 'FAILED']),
      error: z.string().max(1000).optional(),
    }),
  ).min(1).max(100),
});

export function isXploreIntegrationRequestAuthorized(request: Request): boolean {
  const expectedSecret = process.env.LABS_XP_SYNC_SECRET;
  const supplied = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!expectedSecret || !supplied) return false;
  const expectedBuffer = Buffer.from(expectedSecret);
  const suppliedBuffer = Buffer.from(supplied);
  return expectedBuffer.length === suppliedBuffer.length && timingSafeEqual(expectedBuffer, suppliedBuffer);
}

export async function readXpOutbox(limit: number) {
  const batchSize = Math.max(1, Math.min(100, Math.floor(limit)));
  const rows = await labsDb.xpSyncOutbox.findMany({
    where: { status: { in: ['PENDING', 'RETRYING', 'FAILED'] } },
    include: { award: true, player: true },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    take: batchSize,
  });

  if (rows.length) {
    await labsDb.xpSyncOutbox.updateMany({
      where: { id: { in: rows.map((row) => row.id) }, status: { not: 'SYNCED' } },
      data: { status: 'RETRYING', attempts: { increment: 1 } },
    });
  }

  return {
    items: rows.map((row) => ({
      outboxId: row.id,
      sourceAwardId: row.awardId,
      idempotencyKey: row.idempotencyKey,
      labsPlayerId: row.playerId,
      xploreUserId: row.externalUserId,
      tenantId: row.tenantId,
      amount: row.amount,
      reason: row.reason,
      label: `Xplore Labs: ${row.reason.replaceAll(':', ' ').replaceAll('-', ' ')}`,
      weekStart: row.award.weekStart,
      verificationStatus: row.verificationStatus,
      createdAt: row.createdAt.toISOString(),
    })),
  };
}

export async function acknowledgeXpOutbox(body: unknown) {
  const parsed = acknowledgementSchema.safeParse(body);
  if (!parsed.success) throw new Error(parsed.error.message);

  const results = [];
  for (const result of parsed.data.results) {
    const updated = await labsDb.xpSyncOutbox.updateMany({
      where: { id: result.outboxId, status: { not: 'SYNCED' } },
      data: result.status === 'SYNCED'
        ? { status: 'SYNCED', syncedAt: new Date(), lastError: null }
        : { status: 'FAILED', lastError: result.error ?? 'XPLORE rejected the award.' },
    });
    results.push({ outboxId: result.outboxId, updated: updated.count > 0 });
  }
  return { results };
}
