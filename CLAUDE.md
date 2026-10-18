@AGENTS.md

# Xplore Labs

A hub of teaching games for the Xplore club platform. The first game teaches Linux (working title Root Escape): a simulated shell in the browser, a live folder map and a penguin guide.

- Spec: `docs/PRD.md`. Architecture, types and build order: `docs/ARCHITECTURE.md`. Read both before a new step.
- Build one step at a time (ARCHITECTURE section 5). Tests pass before the next step. Each step on its own branch and pull request.

## Commands

```bash
npm run dev          # http://localhost:3000/labs
npm run build
npm run lint
npm run format       # prettier --write
npm test             # vitest run
npm run typecheck    # tsc --noEmit
```

## Next.js rules

- Next.js 16 App Router, TypeScript strict, `basePath: '/labs'`. Read `node_modules/next/dist/docs/` before using an API you are not sure about.
- `basePath` is added to `<Link>` and router paths automatically, but NOT to raw URLs: files in `public/` (sounds, memes, Rive files, images, `fetch`) must go through `asset()` from `src/shared/asset.ts`.
- Links back to Xplore use a plain `<a>`, never `<Link>` (different zone).
- Game screens are client components (`'use client'`). Static pages stay server components.

## Architecture rules

- One folder per game in `src/games/<game>`, shared code in `src/shared`, assets in `public/games/<game>/`.
- The engine (`src/games/*/engine`) is pure TypeScript: no React, no DOM, no Zustand, no Howler, no network, no bridge. It only emits events.
- Each shell command is its own file with `name`, `run`, `help`, registered in one line.
- Error messages copy real Linux wording (`No such file or directory`, `Permission denied`).
- All game code talks to Xplore only through the bridge interface (`src/shared/bridge`). `NEXT_PUBLIC_LABS_BRIDGE=mock` uses localStorage with the same data shape as the future API; `api` is a thin client of the planned NestJS endpoints, untested until Phase B.
- Points and stickers are decided by the server (mock bridge plays that role now), never by UI code.
- Progress: autosave in-progress state after each command, save results on mission completion, retry failed saves, show a saving / saved indicator.
- Content is data, not code: missions in YAML (`src/games/linux/content/missions/<id>.yaml`), validated and played by `npm run content` before dev, build and test (bad files fail the build). Meme reactions come from `public/games/linux/memes/memes.yaml`.
- All player-facing text lives in content files or `src/shared/i18n` (French + English, English fallback). Exception: command help texts live in each command file.
- Engine output copies real Linux (English). The fun lines and jokes around it come from content files, through events.

## Style rules

- Own design tokens as CSS variables, CSS modules, augmented-ui. No Tailwind, no heavy UI kit.
- Use the installed design skills (`frontend-design`, `algorithmic-art`, `motion-design`) for the title screen, hub and animations.
- Respect reduced motion and keep heavy effects (CRT, galaxy) off or paused when not visible.
- No copyrighted assets. Use placeholders for character art, memes and sounds. The penguin must not copy Tux.

## Tests

- Vitest for the engine, parser, every command, goal checker, content schema and bridge (`tests/unit`).
- Playwright for missions 1 to 3 (`tests/e2e`).
