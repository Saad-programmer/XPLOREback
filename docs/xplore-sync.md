# Labs XP and badge sync to XPLORE

Labs stores game progress, badges and a capped XP ledger in its own Supabase
project. The root `schema.prisma` belongs to XPLORE and is not modified here.
The sync is one-way: the Next.js server POSTs pending rows to the exact URL
configured in `XPLORE_API_URL`, then marks them synced only after a 2xx response.

## Configure and run

1. Add `XPLORE_API_URL` as the **full URL of the XPLORE handler**, not just the
   API origin. The exact route is intentionally not assumed; agree its path and
   request/response contract with the XPLORE backend owner.
2. Set `XPLORE_SYNC_SECRET` on both servers. Set `LABS_XP_SYNC_SECRET` on Labs
   to a separate random secret for protecting the scheduled Labs sync trigger.
3. Configure a cron job to POST `https://YOUR_LABS_HOST/labs/api/labs/sync`
   every five minutes with `X-Labs-Sync-Secret: <LABS_XP_SYNC_SECRET>`.
   Vercel Cron or a trusted Supabase Edge Function can call this route. Never
   put either secret in a browser variable.
4. The Labs route retries failed deliveries with exponential backoff and never
   deletes XP rows. A network timeout after XPLORE committed is possible, so
   the XPLORE receiver must be idempotent.

The request body has this shape:

```json
{
  "badges": [{
    "tenantId": "XPLORE_TENANT_UUID",
    "userId": "XPLORE_USER_UUID",
    "key": "linux-first-mission",
    "tier": "BRONZE",
    "label": "Linux: First mission",
    "metadata": {"missionId": "wake-up-hello-world"},
    "awardedAt": "2026-11-15T12:00:00.000Z"
  }],
  "xpEntries": [{
    "tenantId": "XPLORE_TENANT_UUID",
    "userId": "XPLORE_USER_UUID",
    "amount": 5,
    "reason": "LABS_BADGE:linux-first-mission",
    "label": "Linux: First mission",
    "createdAt": "2026-11-15T12:00:00.000Z",
    "campaignId": null,
    "awardedById": null
  }]
}
```

The Labs `user_id` is the UUID from the verified `xplore_user_id` claim and
`tenant_id` is from the verified `tenant_id` claim. If XPLORE uses different
claims or mapping rules, implement that mapping in the trusted auth integration
before enabling the cron.

## Required XPLORE handler behavior

Implement a protected NestJS endpoint at the agreed URL. For each request, in a
database transaction:

1. Validate the integration secret, UUIDs, tenant membership, amount, reason,
   and badge tier.
2. Upsert `MemberBadge` using its `(tenantId, userId, key)` unique key.
3. Deduplicate each XP entry by `(userId, reason)` in an XPLORE-owned receipt or
   Labs source table, then insert `MemberXpEntry` with `campaignId = null` and
   `awardedById = null`.
4. Commit and return 2xx only after all accepted records are committed. Return a
   non-2xx response for a retryable batch failure.

**TODO for the NestJS side:** PostgreSQL unique constraints treat NULL campaign
IDs as distinct, so `@@unique([campaignId, userId, reason])` does not deduplicate
these entries. Add a dedicated receipt table with a unique
`(userId, reason)` constraint (or equivalent unique Labs source ID) without
changing the current Prisma schema until XPLORE approves that migration.

Illustrative NestJS service pseudocode (adapt to the approved route and existing
auth conventions; it is not a route contract):

```ts
await prisma.$transaction(async (tx) => {
  for (const badge of body.badges) {
    await tx.memberBadge.upsert({
      where: {
        tenantId_userId_key: {
          tenantId: badge.tenantId,
          userId: badge.userId,
          key: badge.key,
        },
      },
      create: {
        tenantId: badge.tenantId,
        userId: badge.userId,
        key: badge.key,
        tier: badge.tier,
        label: badge.label,
        metadata: badge.metadata,
        awardedAt: new Date(badge.awardedAt),
      },
      update: {},
    });
  }

  for (const entry of body.xpEntries) {
    const receipt = await tx.labsXpReceipt.createMany({
      data: [{
        userId: entry.userId,
        reason: entry.reason,
        sourceId: `xplore-labs:${entry.userId}:${entry.reason}`,
      }],
      skipDuplicates: true,
    });
    if (receipt.count === 0) continue;

    await tx.memberXpEntry.create({
      data: {
        tenantId: entry.tenantId,
        userId: entry.userId,
        amount: entry.amount,
        reason: entry.reason,
        label: entry.label,
        campaignId: null,
        awardedById: null,
        createdAt: new Date(entry.createdAt),
      },
    });
  }
});
```

Do not treat these as transferable club points. XP is a separate earned ledger;
the Labs database cap is 50 XP per player per Monday-start week in
`Africa/Nouakchott`, and the XPLORE receiver should preserve that meaning.

## Login integration still needed

`app/api/auth/exchange/route.ts` returns 501 intentionally. It contains
the `getXploreSession()` seam and TODO but does not guess the XPLORE login URL,
cookie, token format, or signing key. Before enabling production Supabase mode,
the XPLORE team must define a trusted server-side session verifier and mint a
short-lived Supabase JWT with `xplore_user_id` and `tenant_id` claims. Do not
accept those claims from request JSON or browser-editable metadata.

The current Labs `getCurrentPlayer().points` value is the Labs ledger subtotal.
Fetching the XPLORE-wide member XP total needs a separate approved profile API
contract; this repository does not invent or call an undocumented endpoint.
