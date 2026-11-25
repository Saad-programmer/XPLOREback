# Supabase setup

The Supabase Labs backend is defined by the SQL migration at
[`../supabase/migrations/0001_labs.sql`](../supabase/migrations/0001_labs.sql).
It is separate from the root XPLORE Prisma schema. Do not run Prisma migrations
against the main XPLORE database or use the older `prisma/labs` prototype for
this bridge.

## Create and configure the project

1. Create a Supabase project in the XPLORE organization and region.
2. In **SQL Editor**, run `supabase/migrations/0001_labs.sql`, then
   `supabase/seed.sql`.
3. Copy `.env.example` to `.env.local` and set:
   - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from the
     project API settings.
   - `SUPABASE_SERVICE_ROLE_KEY` on the server only.
   - `LABS_HMAC_SECRET` to a new random secret on the server only.
   - `NEXT_PUBLIC_LABS_BRIDGE=supabase`.
4. The browser auth provider must supply a valid Supabase access token issued
   for the Xplore user. Its verified JWT claims must include UUIDs
   `xplore_user_id` and `tenant_id`. The user and tenant claims must be added by
   a trusted Xplore server, never by browser-editable metadata.
5. Start with `npm run dev`. The bridge reads player data through RLS; session,
   submission, and badge writes are handled by server code.

`app/api/auth/exchange/route.ts` intentionally returns HTTP 501 until the
XPLORE session endpoint and trusted token exchange contract are agreed. Do not
add production credentials or tokens to `.env.example`, source control, or
client-side configuration.

## Sync rewards to XPLORE

Set `XPLORE_API_URL` to the full URL of the approved XPLORE receiver,
`XPLORE_SYNC_SECRET` for that receiver, and `LABS_XP_SYNC_SECRET` for cron
requests to `/labs/api/labs/sync`. Schedule the protected route every five
minutes only after the NestJS receiver is deployed. It must deduplicate
`MemberXpEntry` by `(userId, reason)` because `campaignId = null` does not
provide uniqueness in PostgreSQL. See [`xplore-sync.md`](./xplore-sync.md).

The `/profile` bridge value is the Labs XP subtotal. Showing the XPLORE-wide
member total needs an approved profile endpoint; no endpoint is guessed here.

## Database checks

The SQL tests use pgTAP and roll back their fixtures. Run
`supabase/tests/rls.sql` and `supabase/tests/rewards.sql` against a local
Supabase stack after the migration and badge seed. They exercise user isolation,
the 50-XP transaction cap, retained badges at the cap, idempotency, unknown
badge rejection, and the next ISO week boundary.
