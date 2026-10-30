# Xplore Labs

Teaching games for the Club ILISI platform **Xplore**. Students learn real technical skills by playing short missions, and their progress is saved to their Xplore account.

The first game teaches **Linux**: you type real commands in a simulated terminal to escape a locked server, helped by a penguin guide. Working title: **Root Escape**.

> **Status:** planning done, development not started yet. The full spec is in [`docs/PRD.md`](docs/PRD.md).

## Games

| Game | Guide | Status |
| --- | --- | --- |
| Linux (Root Escape) | Penguin | In design |
| SQL | Dolphin | Planned |
| Git | TBD | Planned |
| Networking | TBD | Planned |

## How it works

- A standalone **Next.js** app, served later at `/labs` on the Xplore domain (Next.js Multi-Zones).
- A **command engine** in TypeScript: virtual file system, parser (quotes, pipes, `>`, `>>`), interpreter and goal checker. It runs fully in the browser.
- **Missions** are written in YAML and validated with Zod at build time.
- The game talks to Xplore only through a **bridge**:
  - `mock`: saves progress in `localStorage` (used during development)
  - `api`: calls the `labs` module in the Xplore NestJS backend (added at integration)
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
| Backend (later) | NestJS `labs` module in Xplore |

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

The app is not built yet. Once it is:

```bash
npm install
cp .env.example .env.local   # NEXT_PUBLIC_LABS_BRIDGE=mock
npm run dev                  # http://localhost:3000/labs
npm test                     # engine unit tests
```

## Environment variables

| Name | Used by | Value |
| --- | --- | --- |
| `NEXT_PUBLIC_LABS_BRIDGE` | game | `mock` now, `api` at integration |
| `NEXT_PUBLIC_LABS_API_URL` | game | Xplore NestJS URL |
| `LABS_HMAC_SECRET` | NestJS only | long random string, never in the frontend |

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
