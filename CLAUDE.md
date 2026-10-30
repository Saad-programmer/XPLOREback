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
- Cache Components is on: no `new Date()`, `Date.now()` or `Math.random()` while rendering (read them in effects or event handlers), and read `params` inside `<Suspense>`. Browser-only libraries (xterm.js) load with `next/dynamic` and `ssr: false` from a client component.

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

- Two styles, kept apart:
  - **Game screens** (title screen, game screen, intro, anything game-styled): own design tokens as CSS variables, CSS modules, augmented-ui. No Tailwind classes there.
  - **Website pages** (`app/(site)`: hub, game details, mission map): Tailwind CSS v4 + shadcn/ui (`src/shared/components/ui`), with 8bitcn pixel components (`ui/8bit`) as small accents. shadcn colors map to the same tokens (`app/site.css`).
- Tailwind Preflight is never global: its reset only applies inside `.site` (the website layout). A shadcn component that renders in a portal (menu, drawer, dialog) needs the `site` class on its content.
- Add shadcn components with `npx shadcn@latest add <name>` (8bitcn: `@8bitcn/<name>`), then check the `cn` import and keep remote fonts out (8bitcn's `retro` font is Pixelify Sans, in `app/site.css`).
- Use the installed design skills (`frontend-design`, `algorithmic-art`, `motion-design`) for the title screen, hub and animations.
- Respect reduced motion and keep heavy effects (CRT, galaxy) off or paused when not visible.
- Cursors: pixel cursors from `node scripts/make-cursors.mjs`, applied in `app/cursors.css`. Keep the native text cursor wherever players type, and the "Classic cursor" setting working.
- No copyrighted assets. Memes and sounds are placeholders for now. The penguin (Pixel) must not copy Tux: its art is in `public/games/linux/characters/pixel/`; after changing the source art, run `node scripts/cut-mascot.mjs` to rebuild the faces.

## Tests

- Vitest for the engine, parser, every command, goal checker, content schema and bridge (`tests/unit`).
- Playwright for missions 1 to 3 (`tests/e2e`).
