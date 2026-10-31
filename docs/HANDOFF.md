# Handoff: finishing Root Escape v1 (Phase A)

Last updated: 2026-10-30 · Owner: Ali Zouhdi (product owner, reviews and merges every pull request)

This file lists **everything left to build** in Xplore Labs v1 before the integration with Xplore (Phase B). It is written for a developer **and** their AI coding agent. Each task is self-contained: goal, files, spec, acceptance criteria and tests.

Spec: [`PRD.md`](PRD.md) · Architecture and every change made during the build: [`ARCHITECTURE.md`](ARCHITECTURE.md) (section 7 is the most important) · Rules for agents: [`../CLAUDE.md`](../CLAUDE.md) and [`../AGENTS.md`](../AGENTS.md) · UI guide: [`design/ui-guide.md`](design/ui-guide.md).

---

## 0. Before you start

### 0.1 Read, in this order

1. `CLAUDE.md` and `AGENTS.md` (project rules: they override any habit or default).
2. This file, fully.
3. `docs/ARCHITECTURE.md` sections 2, 3 and **7** (the code moved on from the first proposal; section 7 says how).
4. The PRD sections named in your task.
5. The code you will touch, and one finished example of the same kind (for a mission: `src/games/linux/content/missions/archive-moving-day.yaml` and its tests).

**Next.js 16 is not the Next.js in your training data.** Before using an API you are not sure about, read the guide in `node_modules/next/dist/docs/`.

### 0.2 Setup

```bash
npm install          # also builds the content bundle
npm run dev          # http://localhost:3000/labs
```

Useful pages (dev): hub `/labs/games`, title screen `/labs/linux`, mission map `/labs/linux/missions`, a mission `/labs/linux/<mission-id>` (for example `/labs/linux/archive-moving-day`). Progress is saved in `localStorage` (mock bridge): clear the site data to start fresh. The intro video plays once; `localStorage['labs:intro-seen'] = '1'` skips it.

### 0.3 Git workflow

- Start every task from an up-to-date `main`, on its own branch (names are given per task).
- Small, clear commits. Run the checks below before every push.
- Open a pull request to `main` with: what changed, how you tested it, screenshots for UI work. **Ali reviews and merges.** Never push to `main`, never force-push a branch someone else uses.
- If you differ from this file or the architecture, add a short note to `docs/ARCHITECTURE.md` section 7 in the same pull request.

### 0.4 Definition of done (every task)

```bash
npm run lint
npm run typecheck
npm test
npm run format:check   # npm run format fixes it
npm run build
```

All pass, and:

- UI work is checked in a real browser at desktop width (1366 px) and phone width (375 px), with "reduced motion" on and off. Screenshots go in the pull request.
- No console errors or warnings in the browser.
- Every player-facing text exists in French and English.
- No copyrighted asset, no remote font, no new heavy dependency without asking Ali.

---

## 1. Where the project stands

**Done and merged (build steps 0 to 7 + polish, and Step 8 part 1):** command engine, mock bridge and progress store, content pipeline, missions 1 to 3, game screen (terminal, live map, dialogue box, password box, victory panel), fun layer (mistake reactions, memes, sounds, effects), title screen, intro video, hub, game details page, mission map with recaps, footer, pixel cursors, missions 4 and 5 (the Archive zone) and the goal type `file_absent`. Preview: <https://xplore-labs.vercel.app/labs>.

**Left (this file):**

| Id | Task | Branch | Depends on | Size |
| --- | --- | --- | --- | --- |
| T1 | Dialogue box redesign | `feature/dialogue-box` | — | **done** |
| T2 | Search hall: missions 6 and 7 | `step-8/search-hall` | — | M |
| T3 | Pipe factory: missions 8 and 9 | `step-8/pipe-factory` | T2 merged | M |
| T4 | Guarded vault: mission 10 (campaign finale) | `step-8/guarded-vault` | T3 merged | S |
| T5 | Bonus detective case: "Who ate the last msemen?" | `step-8/detective-case` | T4 merged | M |
| T6 | Playwright end-to-end tests (missions 1 to 3) | `step-9/e2e` | — | M |
| T7 | README refresh + CONTRIBUTING | `step-9/docs` | T2–T6 merged | S |
| T8 | Final v1 check | — | all | S |

T6 can run in parallel with the missions. Missions go one zone at a time, in order: each one sets the `order` the next one continues from, and they touch the same test file.

### 1.1 Where things live

| What | Where |
| --- | --- |
| Routes | `app/` — game screens: `app/linux/page.tsx` (title), `app/linux/[missionId]/` (mission); website pages: `app/(site)/` (hub, game details, mission map) |
| Engine (pure TS) | `src/games/linux/engine/` — `vfs/`, `parser/`, `commands/` (one file per command, registered in `commands/index.ts`), `interpreter.ts`, `events.ts`, `goals.ts`, `shell.ts` |
| Zones, game name, guide name | `src/games/linux/meta.ts` |
| Missions | `src/games/linux/content/missions/<id>.yaml` |
| Content schema and checks | `src/games/linux/content/schema.ts`, `load.ts`, `scripts/build-content.ts` |
| Classic-mistake reactions, unknown-command lines | `src/games/linux/content/reactions.yaml` |
| Memes | `public/games/linux/memes/memes.yaml` + stickers; sounds in `public/games/linux/sounds/` |
| Game state (one store per mission screen) | `src/games/linux/game-store.ts`; reactions logic: `reactions.ts` |
| Game UI | `src/games/linux/ui/` (`GameScreen`, `Terminal`, `LiveMap`, `DialogueBox`, `PasswordBox`, `VictoryPanel`, `TopBar`, `MissionMap`, `MissionPanel`, `Penguin`…) |
| UI strings (FR/EN) | `src/games/linux/strings.ts`, `src/shared/i18n/` |
| Mission map layout (node spots per island) | `src/games/linux/map-layout.ts` (`NODE_SPOTS`) |
| Bridge (only link to Xplore) | `src/shared/bridge/` (`types.ts`, `mock-bridge.ts`, `api-bridge.ts`) |
| Tests | `tests/unit/linux/*.test.ts`, `tests/unit/shared/*.test.ts` |
| Pixel's faces | `public/games/linux/characters/pixel/face-<mood>.webp` (8 moods) |

### 1.2 Rules and traps learned while building

- **Two styles, kept apart.** Game screens: CSS modules + CSS variables + augmented-ui, no Tailwind. Website pages (`app/(site)`): Tailwind v4 + shadcn/ui. Tailwind's reset only applies inside `.site`.
- **`basePath` is `/labs`.** `<Link>` and the router add it, raw URLs do not: files from `public/` go through `asset()` (`src/shared/asset.ts`).
- **Cache Components is on:** no `new Date()`, `Date.now()` or `Math.random()` while rendering (use effects or event handlers; seeded randomness is in `src/shared/random.ts`). Read `params` inside `<Suspense>`.
- **Next.js keeps visited pages alive (hidden).** Effects must clean up, and modals must close when their page is hidden (`useModalDialog`). Never use `window.confirm()`: use `ConfirmDialog`.
- **The engine stays pure:** no React, DOM, Zustand, Howler, network or bridge in `src/games/*/engine`. It only emits events.
- **Error messages copy real Linux wording** (`No such file or directory`, `Permission denied`, `Operation not permitted`). Engine output is English; jokes come from content files.
- **Shell limits (v1):** one pipeline per line (`a | b | c > file`), with `>` and `>>`. No `;`, `&&`, variables other than `$HOME $USER $PWD`, and **no globbing**: an unquoted `*` or `?` prints "not supported yet". Patterns for `find -name` and `grep` must be quoted: `find . -name '*.log'`.
- **Windows is case-insensitive:** never have two files whose names differ only by case (`stars.ts` vs `Stars.tsx` broke the build once).
- **shadcn CLI** writes `import { cn } from 'cn'` and installs a `cn` package: change the import to `@/src/shared/lib/utils` and uninstall `cn`.
- **YAML:** quote strings that contain `:`, `#`, `'` or start with a symbol. Use `"..."` when the text has an apostrophe (`"C'est"`), or the typographic `’`.
- **Stale types after moving routes:** `rm -rf .next/dev/types` then `npx next typegen`.

---

## 2. T1 — Dialogue box redesign (done)

> **Done on 2026-10-31** (branch `feature/dialogue-box`). Built as specified below, with the default colour fix of 2.4. One change from the spec: the helper returns a tone (`dialogueStyle(kind, mood) → { tone, icon }` in `src/games/linux/dialogue-style.ts`) and the CSS module turns the tone into colours, so the zone colour stays a CSS variable. This section is kept as the reference of the design.

**Goal:** replace the plain dialogue panel with the approved "capsule console" design, so Pixel's lines feel like a game's dialogue system. PRD section 6, UI guide section 5.6.

### 2.1 Reference

- **Live preview (the source of truth for the look):** `docs/design/dialogue-preview.html`. It is a standalone page, not part of the app. View it with a static server from the repo root so the faces load:

  ```bash
  python -m http.server 4100 --bind 127.0.0.1
  ```

  Then open `http://localhost:4100/docs/design/dialogue-preview.html`. The buttons at the top (or the query `?kind=briefing|hint|mistake|victory&zone=0..5&done=1&min=1&phone=1`) switch the states. Its CSS (`.dialogue` and below) is the spec; port it, do not invent a new look.
- Background reading only (do not copy their assets): `docs/design/RootEscape_Pixel_Dialogue_System_Specification.md`.

### 2.2 Files

- `src/games/linux/ui/DialogueBox.tsx` and `DialogueBox.module.css` (rewrite).
- New pure helper, for example `src/games/linux/dialogue-style.ts`: picks the accent and icon of a line (unit-tested).
- `src/games/linux/strings.ts`: new UI strings.
- Maybe `src/games/linux/ui/Icon.tsx` (small icons for hint, mistake, victory).
- Do not change the store's API (`game-store.ts`) unless needed; if you do, update its tests.

### 2.3 Anatomy (desktop, game window up to 1320 px wide)

| Part | Spec |
| --- | --- |
| Frame | Full width of the game screen, 12 px margin. Cut corners (top-left and bottom-right, 14 px) with `clip-path`. 2 px border made of two clipped layers: the outer one is a gradient from the accent to `--line`, the inner one is the panel `#0e1834` with a faint top highlight. Min height 128 px; grows with long French lines. |
| Signal rail | 3 px lit strip along the top edge (from 120 px to 66% of the width), segmented, in the accent colour with a soft glow. A white shimmer crosses it every 2.8 s (none with reduced motion). |
| Hardware details | 3 tiny screws (5 px) in the corners; 3 status LEDs top right, the first one in the accent colour and blinking while the text types. Decorative: `aria-hidden`. |
| Docking bay | 96 px wide slot on the left, cut corners (10 px), dark gradient with an accent glow from the bottom, dashed side rails, and a lit 3 px "floor" under Pixel. Pixel's face is 84 px, bottom-aligned, with a small "pop" (220 ms) when the mood changes. The bay never moves or resizes when the face changes. |
| Connector | A small accent triangle between the bay and the text: Pixel is the one speaking. |
| Name tag | `PIXEL // GUIDE` in Pixelify Sans 13 px bold, accent colour, tinted background, cut corners. An icon before the name per kind: none (briefing), lightbulb (hint), `!` (mistake), star (victory). `GUIDE` is muted. The name comes from `GUIDE_NAME` in `meta.ts`. |
| Text | JetBrains Mono 16 px, line height 1.45, max 76 characters per line, colour `#c0caf5`. A block caret in the accent colour while typing. |
| Main button | 40 px tall, min 110 px, cut corners, Pixelify Sans 14 px. While typing: **outlined** "PASSER" / "SKIP" (shows the whole line). When the line is complete: **filled** "SUIVANT" / "NEXT" + step counter `2/4` (only when there are 2 or more lines). Hidden on the last line of a victory (as today). |
| Minimize button | 36 px square, muted icon, accent border on hover. |
| Victory sparkles | 3 small four-point stars twinkling in the bay (victory only). |

**Phone (under 640 px wide):** 8 px margin; bay 68 px with a 62 px face, aligned to the top; text 14 px; the buttons go on their own row, aligned right; min height 150 px.

**Minimized:** the box becomes a small pill at the same place: Pixel's face in a 52 px circle with an accent ring and glow, a small accent dot (new line waiting), `PIXEL` and "Rouvrir" / "Reopen". Click reopens. The terminal never moves under it.

### 2.4 Accent colour per kind of line

| Kind (`Dialogue['kind']` in `game-store.ts`) | Accent | Icon |
| --- | --- | --- |
| `briefing` | zone colour (`ZONES` in `meta.ts`) | — |
| `info` | zone colour | — |
| `hint` | cyan `#4cc9ff` | lightbulb |
| `reaction` with mood `shocked` or `disappointed` (a mistake) | pink `#f7768e` | `!` |
| `reaction` with another mood (a joke, e.g. reading the msemen recipe) | zone colour | — |
| `victory` | gold `#e0af68` + sparkles | star |

**Decision for Ali (default if he does not answer):** the Guarded vault zone is pink like mistakes, and the Search hall is gold like victories, so in those zones a briefing looks like a mistake or a victory. Default fix: for `briefing` and `info`, the zone colour goes only on the signal rail and the name tag; the frame border, bay glow and button use the neutral blue `#7aa2f7`. Mistake, hint and victory keep their full colour.

Put this logic in the pure helper (`dialogueStyle(kind, mood, zoneColor) → { accent, frame, icon }`) and set the colours as CSS variables on the box (`style={{ '--accent': … }}`).

### 2.5 Behaviour

- Keep the typewriter (`CHAR_MS = 22`, about 45 letters per second) and the blip sound every 3 letters.
- Click on the text or on PASSER: show the whole line. Click again or SUIVANT: next line.
- **Keyboard:** Enter or Space advance the dialogue **only when the focus is not in the terminal, the password box or another input** (Enter in the terminal runs commands). Esc does nothing here.
- Accessibility: the box is an `aside` labelled with the guide's name; screen readers get each full line once (`aria-live="polite"`, the typed letters are `aria-hidden`, as today); every button has a label in both languages; visible focus ring.
- Reduced motion: no typewriter (the whole line at once), no shimmer, no blink, no pop, no sparkles.
- Keep `preloadPenguinFaces()` so a mood change never flashes.
- Fonts: use the app's self-hosted fonts (CSS variables set by `next/font` in `app/layout.tsx`); the preview's Google Fonts link must not be copied.

### 2.6 Acceptance

- [ ] Matches the preview in every state: briefing typing / complete, hint, mistake, joke reaction, victory, minimized, phone, and at least three zone colours.
- [ ] The default colour fix of 2.4 is applied (or Ali's other choice).
- [ ] Unit tests for `dialogueStyle` (every kind, both reaction cases, the vault and search-hall zones).
- [ ] The current game tests pass; mission 1 played by hand from start to victory.
- [ ] Screenshots of every state (desktop and phone) in the pull request.

**Out of scope:** new character art, Rive, sound changes, the victory panel.

---

## 3. Writing a mission (shared by T2 to T5)

### 3.1 The mission file

One file per mission: `src/games/linux/content/missions/<id>.yaml`, and **the file name equals the `id`**. Copy the structure of `archive-moving-day.yaml` (layout goal) or `archive-hidden-scroll.yaml` (password goal). The schema is `src/games/linux/content/schema.ts`.

| Field | Rule |
| --- | --- |
| `id` | kebab-case, stable forever (the database uses it later). Prefix with the zone: `search-hall-…`. |
| `zone` | one of `ZONE_IDS` in `meta.ts`. |
| `order` | campaign position, unique: 6, 7, 8, 9, 10, then 11 for the bonus. |
| `title`, `objective` | `{ en, fr }`. The objective is one short line (top bar's Objective button). |
| `briefing` | 3 or 4 lines, each with a `mood` (neutral, happy, thinking, shocked, proud, disappointed, laughing, sleeping). Story, then the goal, then the command(s) to try. |
| `filesystem` | absolute folder → entries. A string is a file's content; `{ type: dir, children }` for folders; `{ content, mode, owner, group }` for permissions. |
| `start_dir` | usually `'~'` (`/home/intern`). The player is always `intern`, never root. |
| `goal` | see the goal types below. Paths are relative to the home folder. |
| `hints` | 3 hints, from vague to precise; the last one gives the commands. |
| `reactions` | mission-specific: `on` is a full command line, matched exactly after trimming. Use them for the classic wrong move of the mission. |
| `victory` | 1 or 2 lines. |
| `rewards` | `{ points: 10, no_hint_bonus: 5 }` for every mission. |
| `concept` | one sentence: the idea learned. |
| `recap` | one entry per command taught: `command`, `text`, `example`. Commands and examples must start with a real command of the game. |
| `solution` | the shortest clean list of commands that solves it. Played at build time; shown when the player gives up. |

**Goal types:** `password` (the player types a value; use `'{{password}}'` for a personal one, or a literal like `'9'`), `file_exists` (optional `nodeType`), `file_absent`, `file_content` (`equals` or `contains`), `cwd`, `permission` (octal), `command_used` (`name`, `minPipeLength`; checks the **last** line), `all` (several goals).

**`{{password}}`** in any file content or text is replaced by the player's personal password (`xxxx-WORD-00`). For a password goal, the solution's output **must print the password**: the build checks it.

### 3.2 Writing rules

- Dialogue in French and English. Lines up to about 200 characters (the dialogue box shows 1 to 3 sentences).
- Tone (PRD section 7): Moroccan student humour, light Darija ("safi", "wach normal?", "khoya", "hchouma", "yallah"), local references (FSTM, exams, deliberations, msemen, mint tea, le Président). Jokes target the situation, never the player. No real people other than le Président (keep him friendly).
- Files on the server (logs, notes) are **English only**, like a real server.
- Mistakes are part of learning: reactions explain and say how to recover ("restart the mission (↻)").
- Each mission teaches 1 to 3 new commands and reuses old ones.

### 3.3 What the engine supports

| Command | Options |
| --- | --- |
| `ls` | `-l`, `-a` (and `-la`) |
| `cd`, `pwd`, `cat`, `echo`, `clear`, `whoami`, `history`, `help`, `man` | — |
| `head`, `tail` | `-n N` |
| `wc` | `-l`, `-w`, `-c` |
| `grep` | `-i`, `-n`, `-v`, `-c`, `-r`; basic regular expressions (`^`, `$`, `.`, `[0-9]`) |
| `find` | folders, `-name`, `-iname`, `-type f|d` (quoted patterns) |
| `sort` | `-r`, `-n`, `-u` |
| `uniq` | `-c` |
| `mkdir` (`-p`), `touch`, `cp` (`-r`), `mv`, `rm` (`-r`, `-f`) | — |
| `chmod` | numeric (`600`) and symbolic (`u+r`, `go-w`); only the owner may change a file (`Operation not permitted`) |
| fun | `sl`, `sudo` (always refused), `vim`/`vi` (fake trap), `exit` |

There is **no `cut`, `awk`, `sed`, `tr` or `xargs`**: design data so the missions do not need them. If a mission really needs a new option, add it to the command file with real Linux output and unit tests (see `tests/unit/linux/search.test.ts`), in the same pull request.

### 3.4 Check, test, play

1. `npm run content` validates and plays every mission. Its errors name the file and the field; fix until it passes.
2. Add tests to `tests/unit/linux/missions.test.ts`, following the `mission 4` and `mission 5` blocks: the solution wins; for password missions, the personal password works and another player's does not; **every wrong path you thought of** (wrong file deleted, `>` instead of `>>`, …) does not win.
3. Update the order test at the top of `missions.test.ts` if needed.
4. Play the mission in the browser: briefing, hints, every reaction, victory panel, then the mission map (the node, the recap tab after victory).
5. The mission map already has spots for 2 missions on the Search hall and the Pipe factory, 1 on the Vault and 1 on the Detective island (`NODE_SPOTS` in `map-layout.ts`). Adding more missions to a zone needs more spots there.

---

## 4. T2 — Search hall: missions 6 and 7

Zone `search-hall` (gold). Branch `step-8/search-hall`. PRD section 9.

### Mission 6 — "Needle in the logs" (`search-hall-needle-logs`, order 6)

- **Teaches:** `head`, `tail`, `grep` (and `grep -n` / `-i` in the recap).
- **Story:** the search hall. The night guard logged the code of the next door somewhere in `server.log`, a file of hundreds of lines. Reading it all with `cat` is hopeless ("even during exam week you don't read that much").
- **Files:** `~/logs/server.log`, **at least 150 lines** (realistic: `2026-10-12 02:13:44 INFO cron: backup started`…, mostly noise). Its **first lines** (`head`) describe the format; its **last lines** (`tail`) hold the guard's note: "I logged the door code with the tag VAULT-CODE." Inside the file, three `VAULT-CODE` lines: two say `expired`, one says `active: {{password}}`. Optionally `~/logs/README.txt` ("logs are long: use head, tail and grep").
- **Goal:** `password: '{{password}}'`.
- **Hints:** 1) "Don't read it all: look at the start and the end of the file." 2) "`head` shows the first 10 lines, `tail` the last 10. Then `grep WORD file` prints only the lines that contain WORD." 3) "In logs: `tail server.log`, then `grep VAULT-CODE server.log`."
- **Reactions:** `cat server.log` (in `~/logs`) and `cat logs/server.log` (from home): Pixel, laughing: you just printed hundreds of lines, use `head`/`tail`/`grep`.
- **Solution:** `cd logs` · `head server.log` · `tail server.log` · `grep VAULT-CODE server.log`.
- **Recap:** `head` (`head -n 5 server.log`), `tail` (`tail -n 3 server.log`), `grep` (`grep VAULT-CODE server.log`; `-i` ignores case, `-n` shows line numbers).
- **Tests:** the solution prints the personal password; the expired codes are not accepted.

### Mission 7 — "Lost file" (`search-hall-lost-file`, order 7)

- **Teaches:** `find` (`-name`, quoted patterns, `-type`).
- **Story:** le Président lost his badge file somewhere in the campus folders, and the club room is locked without it. Opening every folder with `cd` and `ls` would take until deliberations.
- **Files:** `~/campus/` with **at least 25 folders, 4 levels deep** (amphis, library floors and shelves, cafeteria, labs, clubs…), many small decoy files. The real file: `president-badge.txt` deep inside (for example `campus/library/floor-2/shelf-12/president-badge.txt`) containing `Badge code: {{password}}`. Decoys: `badge-template.txt`, `old-president-badge.txt.bak` with "expired" content, a **folder** named `badges` (to show `-type f` vs `-type d`).
- **Goal:** `password: '{{password}}'`.
- **Hints:** 1) "There is a command that searches by name, in every sub-folder." 2) "`find FOLDER -name NAME` searches FOLDER and everything under it. Quote patterns: `find campus -name '*badge*'`." 3) "`find campus -name president-badge.txt`, then `cat` the path it prints."
- **Reactions:** `find campus -name *badge*` (unquoted) is already refused by the shell with a message; add a Pixel line for it only if the default message is not clear enough in play.
- **Solution:** `find campus -name president-badge.txt` · `cat campus/library/floor-2/shelf-12/president-badge.txt` (adapt to your tree).
- **Recap:** `find -name` (`find campus -name president-badge.txt`), patterns (`find campus -name '*.txt'`), `-type` (`find campus -type d -name badges`).
- **Victory:** the Search hall is done; next stop the Pipe factory.

---

## 5. T3 — Pipe factory: missions 8 and 9

Zone `pipe-factory` (violet). Branch `step-8/pipe-factory`. A pipe of 3 or more commands already triggers the "combo" effect and sound.

### Mission 8 — "Count the intruders" (`pipe-factory-intruders`, order 8)

- **Teaches:** `|`, `sort`, `uniq`, `wc -l` (and `uniq -c`, `sort -n` in the recap).
- **Story:** someone tried to break into the FST server all night. The firewall exported the IP address of every failed login. How many **different** machines attacked?
- **Files:** `~/firewall/failed-ips.txt`: **about 120 lines, one IP per line, unsorted, with many repeats**, from exactly **9** different IPs (pick a fixed number and write it in the goal). Give one IP far more lines than the others (used in mission 9). Also `~/firewall/README.txt`: "one line = one failed login".
- **Why this file:** the engine has no `cut`/`awk`, so the IPs come pre-extracted; the lesson is the pipe.
- **Goal:** `password: '9'` (the number). The answer is the same for everyone; this is accepted for this mission (the count cannot be personal). The file must be too long to count by eye.
- **Hints:** 1) "Chain commands with `|`: the output of one becomes the input of the next." 2) "`sort` puts identical lines together, `uniq` removes repeated neighbours, `wc -l` counts lines." 3) "`sort failed-ips.txt | uniq | wc -l`, then type the number."
- **Reactions:** `uniq failed-ips.txt | wc -l` (forgot to sort, gives a wrong, bigger number): "uniq only removes duplicates that are **next to each other**. Sort first." `wc -l failed-ips.txt`: "That counts every attempt, not every machine."
- **Solution:** `cd firewall` · `sort failed-ips.txt | uniq | wc -l` (prints just the number, like real Linux, so the build finds `9` in the output).
- **Recap:** `|`, `sort`, `uniq` (`sort failed-ips.txt | uniq -c` counts each), `wc -l`, and `sort -n` / `sort -rn` to rank them.
- **Tests:** solution wins with `9`; `uniq` without `sort` gives another number.

### Mission 9 — "Save the evidence" (`pipe-factory-evidence`, order 9)

- **Teaches:** `>` (create / overwrite) and `>>` (append), with `grep`.
- **Story:** the police of the FST (the dean's office) wants a report. Put in `~/evidence.txt` every failed login of the main attacker, then add his requests from the web log.
- **Files:** `~/logs/auth.log` (about 60 lines: `Oct 12 02:13:44 fst sshd: Failed password for root from 41.92.13.7` and `Accepted password for intern from 10.0.0.5` lines); `~/logs/web.log` (about 40 lines; a few `GET /admin` lines from the attacker's IP, the rest normal). Use the attacker IP of mission 8.
- **Goal:** `all`:
  - `file_content` `~/evidence.txt` `contains` one specific `Failed password … 41.92.13.7` line from `auth.log`;
  - `file_content` `~/evidence.txt` `contains` one specific `GET /admin` line of the attacker from `web.log`.
  Using `>` twice overwrites the first part, so the goal fails: that is the lesson.
- **Hints:** 1) "`>` sends the output into a file instead of the screen." 2) "`>` replaces the file, `>>` adds at the end." 3) "`grep 41.92.13.7 logs/auth.log > evidence.txt`, then `grep 41.92.13.7 logs/web.log >> evidence.txt`."
- **Reactions:** `grep 41.92.13.7 logs/web.log > evidence.txt` (overwrote): "Oops, `>` replaced the whole file. The first part is gone: run the first command again, then use `>>`."
- **Solution:** `grep 41.92.13.7 logs/auth.log > evidence.txt` · `grep 41.92.13.7 logs/web.log >> evidence.txt` · `cat evidence.txt`.
- **Recap:** `>` (`grep … > evidence.txt`), `>>` (`grep … >> evidence.txt`), `grep` with a pipe (`grep Failed logs/auth.log | wc -l`).
- **Tests:** solution wins; `>` then `>` does not; `>>` alone into a new file plus the second part does (`>>` creates the file).

---

## 6. T4 — Guarded vault: mission 10, the finale

Zone `guarded-vault` (red). Branch `step-8/guarded-vault`.

### Mission 10 — "Let me in" (`guarded-vault-let-me-in`, order 10)

- **Teaches:** `whoami`, reading `ls -l` permissions (`rw-`, owner), `chmod`, and the difference between `Permission denied` and `Operation not permitted`.
- **Story:** the last door of the server. The exit code is in the vault, but the file is locked, even for its owner. The guard's notes belong to root: nobody touches those.
- **Files** in `~/vault/`:
  - `exit-code.txt`: `{{password}}`, **owner `intern`, mode `000`** (the player owns it but cannot read it);
  - `guard-notes.txt`: owner `root`, mode `600` (cannot be read nor changed: `Operation not permitted` on `chmod`);
  - `README.txt` (readable): "Only the owner of a file can change its permissions."
- **Goal:** `password: '{{password}}'`.
- **Hints:** 1) "Who are you on this server? And who owns each file? `whoami` and `ls -l` will tell." 2) "In `ls -l`, `----------` means nobody can read. The owner can change that with `chmod`: `u+r` adds read for the owner, `600` means read and write for the owner." 3) "`chmod u+r vault/exit-code.txt`, then `cat vault/exit-code.txt`."
- **Reactions:** `chmod 777 exit-code.txt` (and with `vault/`): it works, but you just opened the vault to the whole FST; `600` or `u+r` is enough. `chmod 600 guard-notes.txt`: that file is root's; only its owner can change it. The global `permission_denied` (bouncer) and `sudo` reactions already exist in `reactions.yaml`.
- **Solution:** `cd vault` · `ls -l` · `whoami` · `chmod u+r exit-code.txt` · `cat exit-code.txt`.
- **Recap:** `whoami`, `ls -l` (how to read `-rw-r--r-- intern`), `chmod` numeric (`chmod 600 exit-code.txt`) and symbolic (`chmod u+r exit-code.txt`).
- **Victory (campaign finale, 2 lines):** the player escaped the server; Pixel is proud (and pretends he never doubted). Tease the bonus case: "…but someone ate the last msemen."
- **Tests:** solution wins; `cat` before `chmod` fails with `Permission denied`; `chmod` on `guard-notes.txt` fails with `Operation not permitted`.

---

## 7. T5 — Bonus detective case: "Who ate the last msemen?"

Zone `detective` (cyan). Branch `step-8/detective-case`. Order 11. Id `detective-last-msemen`.

- **Teaches:** combining `grep` (with regular expressions and `-v`, `-i`), pipes and `sort`/`uniq -c` to cross-check clues.
- **Story:** Friday, the club room. Le Président brought msemen for the meeting; at 14:30 the last one is gone. Pixel opens an investigation, very seriously.
- **Suspects** (fictional user names, except le Président): `president`, `l3arbi` (an ILISI 1 student), `samira_dev`, `intern` (the player!), and `pixel`.
- **Twist:** the culprit is **`pixel`**. The clues point to him, he tries to change the subject in the dialogue, and the victory line is his confession ("…Bon. On n'en parle plus. Hchouma."). Le Président is the funny red herring (he opened the fridge, but to **put** the msemen in).
- **Files** in `~/case/`:
  - `note.txt`: the facts: the last msemen disappeared between 14:20 and 14:30 on Friday; whoever ate it opened the fridge **and** was in the room then.
  - `fridge.log` (about 150 lines, Monday to Friday): `Fri 14:23 fridge opened by pixel`… Every day has lines around 14:2x, so the player must filter by day **and** time: `grep '^Fri 14:2' fridge.log` or `grep Fri fridge.log | grep 14:2`.
  - `badges.log`: who entered and left the club room, same format.
  - `chat.txt`: the club group chat, in English: alibis (`l3arbi` presenting in amphi B at 14:25, `samira_dev` at the cafeteria), le Président's message at 14:05 "msemen are in the fridge, don't touch before the meeting".
- **Goal:** `password: 'pixel'` (the hint and objective say: type the user name of the culprit as it appears in the logs).
- **Hints:** 1) "Start with `note.txt`, then look only at Friday between 14:20 and 14:30." 2) "`grep '^Fri 14:2' fridge.log` keeps the Friday lines from 14:20 to 14:29. Do the same with `badges.log`, and check alibis with `grep NAME chat.txt`." 3) The full chain of commands and the name.
- **Reactions:** `grep pixel fridge.log` → Pixel, shocked: "Why are you looking at MY name? Focus on the real suspects." The answer `president` (if the password box gives feedback per wrong answer, otherwise via the hint text): le Président only put the msemen in.
- **Solution:** `cd case` · `cat note.txt` · `grep '^Fri 14:2' fridge.log` · `grep '^Fri 14:2' badges.log` · `grep -i amphi chat.txt` (adapt to your data). Make sure at least one useful step is a pipe (for example `grep Fri badges.log | grep 14:2`).
- **Recap:** `grep` with a regular expression (`grep '^Fri 14:2' fridge.log`), `grep -v` (`grep -v president fridge.log`), counting with `grep … | sort | uniq -c`.
- **Ask Ali** to approve the final text (it involves le Président) before merging.

---

## 8. T6 — Playwright end-to-end tests (build step 9)

**Goal:** missions 1 to 3 are played automatically in a real browser, from the mission page to the victory panel. Branch `step-9/e2e`. PRD section 13.

- Add `@playwright/test` (dev dependency), `playwright.config.ts`, and `npm run e2e`. Chromium only is enough.
- `webServer`: `npm run build && npm run start` (closest to production) on port 3000, `baseURL: 'http://localhost:3000/labs'`, `reuseExistingServer` locally.
- Each test starts with clean storage and sets `localStorage['labs:intro-seen'] = '1'` (an init script) so the intro does not play.
- **Typing in the terminal:** click the terminal, then type into xterm's hidden `textarea` (`.xterm-helper-textarea`), and press Enter. Read the output from the terminal's rendered rows (`.xterm-rows`) or the accessibility tree.
- **Per mission (1, 2, 3):** open `/labs/linux/<id>`; read the solution from the content bundle (`src/games/linux/content/generated/content.json`, built by `npm run content`) instead of hard-coding commands; run it; find the personal password on screen (it has the shape `xxxx-WORD-00`); type it in the password box; expect the victory panel; then open the mission map and expect the mission done and the next one open.
- One more test: progress survives a reload in the middle of a mission (the terminal history and current folder come back).
- Keep tests independent and under about 30 s each. No fixed `waitForTimeout`; wait for text or state.
- Do not add the e2e run to `npm test` (Vitest stays fast). Document `npx playwright install chromium` in the README (T7).

**Acceptance:** `npm run e2e` passes three times in a row on a clean checkout.

---

## 9. T7 — README refresh and CONTRIBUTING

Branch `step-9/docs`. The README still says "development not started".

**README.md:** what Xplore Labs and Root Escape are (with a screenshot of the game screen), the live preview link, requirements (Node 24 is used in development; add an `.nvmrc` or an `engines` field, there is none yet), setup and commands (dev, build, test, e2e, content, format), the folder map (short version of section 1.1 above), the mock / api bridge, environment variables (PRD section 18), status of the games, credits (club, contributors).

**CONTRIBUTING.md**, step by step, for a student who never saw the code:

1. **Add a mission:** copy a mission file, the field table of section 3.1, run `npm run content`, add the tests, play it, open a pull request. Include the writing rules (3.2) and the engine limits (3.3).
2. **Add a meme or a sound:** drop the file in `public/games/linux/memes/` or `sounds/`, add one line to `memes.yaml`, licences allowed (original, Kenney, freesound CC0), no famous clips.
3. **Add a command:** one file in `engine/commands/`, register it in one line, real Linux wording, help text in English and French, unit tests.
4. **Add a game to the hub:** one entry in `src/shared/games.ts`, its folder in `src/games/<game>` and `public/games/<game>/`, its about pages.
5. **Change Pixel's art or the cursors:** the scripts (`cut-mascot.mjs`, `make-cursors.mjs`, `process-map.mjs`) and where the sources live.
6. **Pull request checklist:** the definition of done of section 0.4.

---

## 10. T8 — Final v1 check (Phase A)

Run through PRD section 18 "Definition of done for v1" in mock mode:

- [ ] Missions 1 to 10 and the bonus case playable from start to end, in French and English.
- [ ] Progress kept after a refresh (mock mode; "another device" waits for Phase B).
- [ ] All tests green (`npm test`, `npm run e2e`), lint, typecheck, build.
- [ ] Lighthouse performance 90 or more on a mission page (production build).
- [ ] Someone who never used Linux finishes zone 1 without help (ask a DEUST or ILISI 1 student).
- [ ] Mission map: every zone has its missions, stars and recaps; no "Soon" left except future zones.

Report the results to Ali in one pull request description or issue.

---

## 11. Not in this handoff (ask Ali first)

These are known, but waiting for a decision or a file. Do not start them without Ali:

- Title music (needs the file and its licence; plays on the title screen, fades out on leaving, "Music" switch).
- Landing page at `/labs` (today it redirects to the hub `/labs/games`).
- Zone-completion bonus (PRD: 20 points + a skill sticker per zone, decided by the server / mock bridge) and the profile panel.
- Original meme stickers and recorded sounds (placeholders today), final game title font, Rive animation of Pixel.
- The Vercel environment variables `GITHUB_TOKEN` and `NEXT_PUBLIC_FEEDBACK_URL`.
- **Phase B:** the NestJS `labs` module, the api bridge and the `/labs` rewrite in Xplore (PRD section 18, Prompt B). It needs the integration answers of PRD section 17.

---

## 12. Prompt for the AI agent

Paste this into the agent (Claude Code or another) at the root of the repo, with the task id:

```markdown
You are working on Xplore Labs (Next.js 16, TypeScript strict). Your task: <T1 | T2 | … from docs/HANDOFF.md>.

1. Read CLAUDE.md, AGENTS.md, then docs/HANDOFF.md fully, then docs/ARCHITECTURE.md
   sections 2, 3 and 7, and the PRD sections your task names. Next.js 16 differs from
   your training data: check node_modules/next/dist/docs/ before using an API you are
   unsure about.
2. Read the code you will change and one finished example of the same kind.
3. Before writing code, give me a short plan: files you will create or change, data or
   design choices the task leaves open, tests you will add. Wait for my OK.
4. Work on the branch named in the task, from an up-to-date main. Follow the project
   rules exactly (two styles, pure engine, real Linux wording, FR + EN text, no remote
   fonts, no copyrighted assets).
5. Done means: npm run lint, typecheck, test, format:check and build all pass; the
   acceptance list of the task is checked; UI is verified in a browser at 1366 px and
   375 px with reduced motion on and off. Note any deviation in docs/ARCHITECTURE.md
   section 7.
6. Commit with clear messages, push the branch, and write the pull request description
   (what, how tested, screenshots). Do not merge: Ali reviews and merges.
```
