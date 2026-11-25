# Xplore Labs

Teaching games for the Club ILISI platform **Xplore**. Students learn real technical skills by playing short missions, and their progress is saved to their Xplore account.

The first game teaches **Linux**: you type real commands in a simulated terminal to escape a locked server, helped by a penguin guide. Working title: **Root Escape**.

> **Status:** Linux game and hub are implemented; production Xplore login and XP sync still need the contracts described below. The full spec is in [`docs/PRD.md`](docs/PRD.md).

## Games

| Game | Guide | Status |
| --- | --- | --- |
| Linux (Root Escape) | Penguin | Playable |
| SQL | Dolphin | Preview |
| Git | TBD | Planned |
| Networking | TBD | Planned |

## How it works

- A standalone **Next.js** app, served later at `/labs` on the Xplore domain (Next.js Multi-Zones).
- A **command engine** in TypeScript: virtual file system, parser (quotes, pipes, `>`, `>>`), interpreter and goal checker. It runs fully in the browser.
- **Missions** are written in YAML and validated with Zod at build time.
- The game talks to Xplore only through a **bridge**:
  - `mock`: saves progress in `localStorage` (used during development)
  - `api`: calls the `labs` module in the Xplore NestJS backend (added at integration)
  - `supabase`: stores player progress in Supabase; the server awards badges and
    up to 50 XP per player per ISO week before forwarding them to XPLORE
- Points and stickers are given only by the server.

## Tech stack

| Area | Tools |
| --- | --- |
| App | Next.js (App Router), React, TypeScript |
| Terminal | xterm.js |
| Live folder map | D3.js |
| Characters and effects | Rive, GSAP, canvas-confetti |
| Sound | Howler.js |
| State | Zustand |
| Styling | Games: CSS modules, CSS variables, augmented-ui. Website pages: Tailwind CSS v4, shadcn/ui, 8bitcn accents |
| Content | YAML + Zod |
| Tests | Vitest (engine), Playwright (missions) |
| Backend | Supabase for Labs; XPLORE NestJS integration is configured separately |

## Project structure (planned)

```text
xplore-labs/
  docs/PRD.md          full product spec
  public/intro/        Labs intro video (sound + silent)
  app/(site)/          website pages: hub, game details, mission map (navbar, Tailwind + shadcn)
  app/linux/           game screens: title screen, missions
  src/shared/          bridge, progress, sound, memes, UI, theme, game registry
  src/games/linux/     engine, mission content, UI, theme
  public/games/linux/  memes, sounds, characters, cover (capsule art)
  public/brand/        Xplore Labs logo and mark
  design/              source art (map islands), not deployed
  tests/               Vitest and Playwright tests
```

## Getting started

```bash
npm install
npm run content
cp .env.example .env.local   # NEXT_PUBLIC_LABS_BRIDGE=mock by default
npm run dev                  # http://localhost:3000/labs
npm test                     # engine unit tests
```

## Environment variables

| Name | Used by | Value |
| --- | --- | --- |
| `NEXT_PUBLIC_LABS_BRIDGE` | game | `mock` (default), `api`, or `supabase` |
| `NEXT_PUBLIC_LABS_API_URL` | game | Xplore NestJS URL |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser | Supabase project URL and public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` / `LABS_HMAC_SECRET` | server only | server database access and mission signing |
| `XPLORE_API_URL` / `XPLORE_SYNC_SECRET` | server only | approved XPLORE receiver URL and its auth secret |
| `LABS_XP_SYNC_SECRET` | server only | protects the scheduled Labs sync trigger |
| `GITHUB_TOKEN` | footer (server, optional) | read-only token ("Metadata: read" on this repo): lists the repo's contributors as developers. Without it the footer shows a fallback list |
| `NEXT_PUBLIC_FEEDBACK_URL` | footer (optional) | where the "Your feedback" button leads; the button is hidden while it is empty |

## Supabase setup

1. Create a Supabase project and open **SQL Editor**.
2. Run [`supabase/migrations/0001_labs.sql`](supabase/migrations/0001_labs.sql),
   then run [`supabase/seed.sql`](supabase/seed.sql) to load the badge catalog.
3. Copy `.env.example` to `.env.local`; set the Supabase project URL and anon
   key as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Set
   `SUPABASE_SERVICE_ROLE_KEY` and `LABS_HMAC_SECRET` as server-only secrets.
4. Select `NEXT_PUBLIC_LABS_BRIDGE=supabase` and restart the app. A trusted
   Xplore-issued Supabase JWT with `xplore_user_id` and `tenant_id` claims is
   required. The auth exchange route deliberately returns 501 until the Xplore
   session endpoint and token-issuing contract are agreed; see
   [`docs/xplore-sync.md`](docs/xplore-sync.md).
5. To send rewards to XPLORE, configure `XPLORE_API_URL` as the full approved
   receiver URL, set both sync secrets server-side, and call
   `/labs/api/labs/sync` every five minutes with `X-Labs-Sync-Secret`. The
   NestJS receiver must deduplicate `(userId, reason)` because the current
   nullable-campaign Prisma unique key does not do so.

The database applies RLS to every Labs table. The weekly cap is stored in
`labs_config`; a Postgres transaction lock and ledger uniqueness keep badge
rewards idempotent and within the limit. Use `supabase/tests/*.sql` against a
local Supabase stack to run the RLS and reward checks with pgTAP.

The player points returned by the Labs bridge are the Labs XP subtotal. Reading
the main site's overall XP total requires an XPLORE profile API contract that
has not been provided; the receiver URL and login/session exchange remain
explicitly configurable rather than guessed.

## Roadmap

1. **Phase A:** build the full Linux game in mock mode (engine, missions 1 to 10, game screen, title screen, hub).
2. **Phase B:** add the `labs` module to the Xplore backend and connect the game.
3. **Later:** more games (SQL, Git, networking) using the same format.

See section 15 of the PRD for details.

## Contributing

- Read [`docs/PRD.md`](docs/PRD.md) before starting.
- Work on a branch and open a pull request into `main`.
- No copyrighted assets: use your own or free-to-use art, memes and sounds.
- Keep secrets out of the frontend and out of the repo.

## Team

- **Ali Zouhdi** ([@Ali-Dev06](https://github.com/Ali-Dev06))
- Second developer: TBD
- Built for the Club ILISI, FST Mohammedia.
