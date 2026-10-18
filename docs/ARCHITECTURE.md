# Xplore Labs — Architecture proposal (Step 0)

Status: **proposal, waiting for approval**. Spec: [`PRD.md`](PRD.md). Project rules: [`../CLAUDE.md`](../CLAUDE.md).

This file fixes the folder layout, the main types and the build order before any game code is written. Types below are the target shape; small changes during implementation are noted in the PR of each step.

## 1. Defaults used (PRD section 17)

| Question        | Default                                     | Change it by                              |
| --------------- | ------------------------------------------- | ----------------------------------------- |
| Package manager | npm                                         | —                                         |
| Next.js         | 16.4 (latest stable, App Router)            | matching Xplore's version later if needed |
| Languages       | French + English, English is the fallback   | —                                         |
| Game name       | Root Escape (working title)                 | one constant in `src/games/linux/meta.ts` |
| Penguin name    | `Pixel` (placeholder)                       | one constant + content files              |
| Humor tone      | mix of dev memes and light local references | content files only                        |

## 2. Folder structure

```text
xplore-labs/
  AGENTS.md, CLAUDE.md           agent instructions (CLAUDE.md imports AGENTS.md)
  docs/                          PRD, this file
  app/                           Next.js routes, served under basePath /labs
    layout.tsx                   root layout, fonts, theme tokens
    page.tsx                     Labs hub (game cards)
    linux/page.tsx               title screen
    linux/missions/page.tsx      mission map
    linux/[missionId]/page.tsx   game screen
  src/
    shared/
      bridge/                    types.ts, mock-bridge.ts, api-bridge.ts (stub), index.ts (picks one from env)
      progress/                  Zustand store, autosave, retry queue
      sound/                     Howler wrapper, mute, meme sounds toggle
      memes/                     memes.yaml schema + reaction player
      i18n/                      LocalizedText helpers, UI strings (fr, en)
      ui/                        top bar, maximize/restore, dialogue box, overlays
      theme/                     global tokens (CSS variables)
      games.ts                   game registry for the hub
    games/
      linux/
        meta.ts                  game name, guide name, zones
        engine/                  pure TypeScript, no React, no network
          vfs/                   virtual file system + serialize/restore
          parser/                tokenizer, pipes, redirections
          commands/              one file per command + registry
          interpreter.ts         runs pipelines on the vfs
          events.ts              typed event bus
          goals.ts               goal checker
          shell.ts               public entry: createShell(mission, secrets)
        content/
          missions/*.yaml        one file per mission
          reactions.yaml         classic-mistake reactions
          unknown-command.yaml   funny lines pool
          man/*.yaml             short man pages
          schema.ts              Zod schemas for all content
        ui/                      terminal, live map, title screen, galaxy
        theme/                   zone accent colors
  public/intro/                  Labs intro video (sound + silent) and poster image
  public/games/linux/            memes/ (memes.yaml + stickers), sounds/, characters/, cover/
  tests/
    unit/                        Vitest (engine, content, bridge)
    e2e/                         Playwright (missions 1 to 3)
```

Import alias: `@/*` points to the repo root, so code imports look like `@/src/games/linux/engine/shell`.

## 3. Main types

### 3.1 Virtual file system

```ts
type Mode = number; // octal permissions, e.g. 0o644

interface NodeMeta {
  name: string; // hidden = name starts with "."
  owner: string;
  group: string;
  mode: Mode;
  mtime: number; // fake clock, for ls -l
}
interface FileNode extends NodeMeta {
  type: 'file';
  content: string;
} // size = content length
interface DirNode extends NodeMeta {
  type: 'dir';
  children: Map<string, VfsNode>;
}
type VfsNode = FileNode | DirNode;

interface Vfs {
  resolve(path: string, cwd: string): string; // normalizes ., .., ~
  stat(path: string): VfsNode | null;
  readFile(path: string, user: User): Result<string>;
  writeFile(path: string, data: string, mode: 'overwrite' | 'append', user: User): Result<void>;
  mkdir(path: string, opts: { parents: boolean }, user: User): Result<void>;
  remove(path: string, opts: { recursive: boolean; force: boolean }, user: User): Result<void>;
  move(from: string, to: string, user: User): Result<void>;
  copy(from: string, to: string, opts: { recursive: boolean }, user: User): Result<void>;
  chmod(path: string, mode: Mode, user: User): Result<void>;
  serialize(): SerializedVfs; // plain JSON for checkpoints
}

interface User {
  name: string;
  groups: string[];
  home: string;
}
type Result<T> = { ok: true; value: T } | { ok: false; error: ShellError };
interface ShellError {
  kind: ErrorKind;
  message: string;
} // message uses real Linux wording
type ErrorKind =
  | 'not_found'
  | 'permission_denied'
  | 'not_a_directory'
  | 'is_a_directory'
  | 'already_exists'
  | 'not_empty'
  | 'command_not_found'
  | 'usage'
  | 'refused';
```

### 3.2 Parser

```ts
interface SimpleCommand {
  name: string;
  args: string[];
} // quotes already removed
interface Redirect {
  op: '>' | '>>';
  target: string;
}
interface Pipeline {
  commands: SimpleCommand[];
  redirect?: Redirect;
  raw: string;
}
type ParseResult = { ok: true; pipeline: Pipeline } | { ok: false; error: ShellError };
```

v1 has one pipeline per line (no `;`, `&&`, globbing or variables). The parser rejects them with a friendly message.

### 3.3 Commands

```ts
interface CommandContext {
  args: string[];
  stdin: string | null; // output of the previous command in a pipe
  shell: ShellState; // vfs, cwd, user, history
  emit: (e: EngineEvent) => void;
}
interface CommandOutput {
  stdout: string;
  stderr: string;
  exitCode: number;
  errorKind?: ErrorKind;
}

interface Command {
  name: string;
  run(ctx: CommandContext): CommandOutput;
  help: { usage: string; summary: LocalizedText };
}
```

Each command is one file in `engine/commands/` and is added to the registry in one line.

### 3.4 Events (engine → UI, sounds, memes, goals)

```ts
type EngineEvent =
  | {
      type: 'command';
      raw: string;
      name: string;
      args: string[];
      exitCode: number;
      errorKind?: ErrorKind;
      pipeLength: number;
    }
  | { type: 'cwd_changed'; from: string; to: string }
  | {
      type: 'fs_changed';
      change: 'create' | 'delete' | 'move' | 'modify' | 'chmod';
      path: string;
      to?: string;
      nodeType: 'file' | 'dir';
    }
  | { type: 'special'; kind: SpecialKind } // rm -rf /, sudo, sl, vim, cd into a file…
  | { type: 'goal_reached'; missionId: string }
  | { type: 'clear' };

type SpecialKind =
  'rm_rf_root' | 'sudo' | 'sudo_spam' | 'sl' | 'vim_trap' | 'cd_into_file' | 'exit';
```

The event bus is a small typed emitter: `on(type, handler)` returns an unsubscribe function.

### 3.5 Mission content (YAML, validated with Zod)

```ts
type LocalizedText = string | { en: string; fr?: string }; // plain string = same text in both languages
type Mood =
  'neutral' | 'happy' | 'thinking' | 'shocked' | 'proud' | 'disappointed' | 'laughing' | 'sleeping';

interface DialogueLine {
  mood: Mood;
  text: LocalizedText;
}

type FsEntry =
  | string // file content
  | { type?: 'file'; content: string; mode?: string; owner?: string; group?: string }
  | {
      type: 'dir';
      mode?: string;
      owner?: string;
      group?: string;
      children?: Record<string, FsEntry>;
    };

type Goal =
  | { type: 'password'; value: string } // usually "{{password}}"
  | { type: 'file_exists'; path: string; nodeType?: 'file' | 'dir' }
  | { type: 'file_content'; path: string; equals?: string; contains?: string }
  | { type: 'cwd'; path: string }
  | { type: 'permission'; path: string; mode: string }
  | { type: 'command_used'; name?: string; minPipeLength?: number }
  | { type: 'all'; goals: Goal[] }; // several goals at once

interface Mission {
  id: string; // stable, used in the database later
  game: 'linux';
  zone: ZoneId; // 'wake-up-room' | 'archive' | 'search-hall' | 'pipe-factory' | 'guarded-vault' | 'detective'
  order: number;
  title: LocalizedText;
  guide: 'penguin';
  user: string; // player user name in the shell, e.g. "intern"
  briefing: DialogueLine[];
  filesystem: Record<string, Record<string, FsEntry>>; // absolute dir path -> entries
  start_dir: string;
  secrets?: string[]; // names replaced per player, e.g. ["password"]
  goal: Goal;
  hints: LocalizedText[]; // vague -> precise
  reactions?: { on: string; mood: Mood; text: LocalizedText }[];
  rewards: { points: number; no_hint_bonus: number };
  concept: LocalizedText;
}
```

`{{name}}` in any text or file content is replaced by the player's secret of that name. Personal passwords are `HMAC(secret, userId + missionId + name)`; mock mode uses a fixed local secret.

### 3.6 Bridge (the only link to Xplore)

```ts
interface LabsBridge {
  getCurrentPlayer(): Promise<Player>;
  getProgress(game: GameId): Promise<GameProgress>;
  startMission(missionId: string): Promise<MissionStart>;
  saveCheckpoint(missionId: string, state: Checkpoint): Promise<void>;
  submitMission(
    missionId: string,
    answer: string | null,
    stats: SubmitStats,
  ): Promise<SubmitResult>;
  getSettings(): Promise<Settings>;
  saveSettings(settings: Settings): Promise<void>;
}

interface Player {
  id: string;
  name: string;
  promotion?: string;
  avatarUrl?: string;
  points: number;
}
interface GameProgress {
  game: GameId;
  currentMissionId: string | null;
  missions: Record<string, MissionResult>;
  unlocks: Unlock[];
  totalPoints: number;
}
interface MissionResult {
  status: 'done';
  bestScore: number;
  hintsUsed: number;
  attempts: number;
  bestTimeS: number;
  shortestCmdLen: number | null;
  firstCompletedAt: string;
}
interface MissionStart {
  missionId: string;
  secrets: Record<string, string>;
  checkpoint: Checkpoint | null;
}
interface Checkpoint {
  missionId: string;
  vfs: SerializedVfs;
  cwd: string;
  history: string[];
  hintsUsed: number;
  attempts: number;
  startedAt: string;
  updatedAt: string;
}
interface SubmitStats {
  hintsUsed: number;
  attempts: number;
  timeS: number;
  shortestCmdLen: number | null;
}
interface SubmitResult {
  success: boolean;
  pointsAwarded: number;
  firstCompletion: boolean;
  stickers: string[];
  progress: GameProgress;
}
interface Unlock {
  itemType: 'sticker' | 'sound' | 'meme';
  itemId: string;
  unlockedAt: string;
}
interface Settings {
  muted: boolean;
  memeSounds: boolean;
  reducedMotion: boolean;
  crt: boolean;
  language: 'fr' | 'en';
  maximized: boolean;
}
```

`NEXT_PUBLIC_LABS_BRIDGE=mock` uses localStorage with exactly these shapes; `api` is a stub until Phase B.

### 3.7 Game registry and memes

```ts
type GameId = 'linux' | 'sql' | 'git' | 'network';
interface GameEntry {
  id: GameId;
  title: LocalizedText;
  subject: string;
  status: 'play' | 'soon';
  href: string;
  cover: string;
  preview?: string;
  guide: string;
  blurb: LocalizedText;
}

type MemeEvent =
  'give_up' | 'rm_rf_root' | 'sudo_spam' | 'vim_trap' | 'mission_success_no_hint' | 'idle_60s';
interface MemeEntry {
  event: MemeEvent;
  sound?: string;
  sticker?: string;
  chance?: number;
}
```

## 4. Data flow in one turn

```text
input line --> parser --> interpreter --> commands (read/write vfs)
                                |
                                +--> events --> goal checker --> goal_reached
                                           --> live map, penguin, sounds, memes (UI side)
                                           --> progress store --> localStorage now, bridge checkpoint later
```

The engine never imports React, Zustand, Howler or the bridge. The UI subscribes to events.

## 5. Build order

| Step | Content                                                                          | Done when                                           |
| ---- | -------------------------------------------------------------------------------- | --------------------------------------------------- |
| 0    | This file, CLAUDE.md, empty Next.js app with lint, Prettier, Vitest              | approved; `/labs` loads; lint and test commands run |
| 1    | Engine: vfs, parser, interpreter, commands, events, goals                        | all engine unit tests pass                          |
| 2    | Bridge interface, mock bridge, progress store (autosave, retry, saved indicator) | tests pass; progress survives a refresh             |
| 3    | Content schema + loader, secrets, missions 1 to 3                                | missions 1 to 3 solved in tests                     |
| 4    | Game screen: top bar, xterm terminal, D3 map, dialogue box, maximize             | mission 1 playable in the browser                   |
| 5    | Mistake reactions, meme reactions, sounds, effects, reduced motion               | every PRD reaction triggers                         |
| 6    | Title screen with galaxy, logo, menu                                             | smooth, pauses when hidden                          |
| 7    | Intro video (start screen, skip, first visit only), Labs hub + mission map       | intro → hub → title → map → mission works           |
| 8    | Missions 4 to 10 + bonus case                                                    | all 11 playable                                     |
| 9    | Playwright e2e, README, CONTRIBUTING                                             | all tests green                                     |

Each step is its own branch and pull request.

## 6. Open points for your review

1. `LocalizedText` as `string | { en, fr }`: lets students write one language and add the other later. OK?
2. Penguin placeholder name `Pixel`: fine until the real name is chosen?
3. Shell user per mission (`intern` by default, `root` never given to the player): OK?
4. No globbing (`*.txt`) in v1, to keep the parser small. It can come in v2. OK?

## 7. Changes made during implementation

The code is the source of truth; these are the differences from the proposal above.

**Step 1 (engine)**

- Vfs results carry only an `ErrorKind` (`VfsResult<T>`). Each command builds its own message, because real Linux words the same error differently per command (`cat: x: No such file or directory` vs `ls: cannot access 'x': ...`).
- Vfs methods take positional flags (`mkdir(path, user, parents)`) and work on exact paths. Commands decide things like "copy into this folder".
- Commands write output with `ctx.out()` / `ctx.err()` instead of returning strings, so errors and output appear in the right order. `shell.run()` returns the chunks plus `stdout`, `stderr`, `exitCode` and `goalReached`.
- New error kinds: `invalid_argument`, `operation_not_permitted`, `syntax`.
- The `command` event also has `names` (every command of the pipe) and `redirect`.
- `$HOME`, `$USER` and `$PWD` are expanded. Unquoted `*` and `?` give a clear "not supported yet" message (point 4 of section 6).
- Command help texts (`help`, `man`, `--help`) live next to each command, in English and French. Mission content can override a man page.

**Step 2 (bridge and progress)**

- `startMission` and `submitMission` also take the `game`. `saveCheckpoint` takes one `Checkpoint` that holds its own `game` and `missionId`.
- `Checkpoint.state` is game-specific JSON (`unknown`). For Linux it is the shell snapshot (file system, current folder, history).
- One personal secret per mission: `{{password}}` = `HMAC-SHA256(secret, "<userId>:<missionId>")`, shown as `xxxx-WORD-00` (`src/shared/bridge/password.ts`). The NestJS module must use the same formula.
- Points: 10 per mission + 5 without hints, only the first time (mock rules in `mock-bridge.ts`). Zone bonuses and stickers come when zones exist (Step 8 / Phase B).
- Saving: every checkpoint is written to localStorage at once; the server gets it every 2 min or on `flushCheckpoints()` (page hidden). Failed saves wait in a queue in localStorage and are retried after 2 s, 5 s, 15 s, 30 s, then every 60 s. A submit made offline is queued and the local checkpoint is kept until the server confirms it.
- `SaveIndicator` (`src/shared/ui`) shows saving / saved / offline. It goes in the game top bar in Step 4.

**Step 3 (missions)**

- Mission files live in `src/games/linux/content/missions/<id>.yaml`; the file name must equal the `id`.
- `npm run content` (also run before dev, build, test, typecheck and after install) validates every file with Zod, plays it, and writes `content/generated/content.json` (git-ignored). The game imports only that bundle.
- Each mission is played at build time: the start folder must exist, the goal must not be met at the start, the `solution` commands must run without errors, show the password on screen (password goals) and reach the goal.
- New mission fields: `solution` (required, also used for "give up") and `victory` (dialogue lines after success).
- `order` is the campaign position and is unique across all missions. Zones and their colors are in `src/games/linux/meta.ts`.
- Dialogue, hints, victory and concept are in English and French. Text inside the server's files is English only, like a real server.
- `src/games/linux/session.ts` builds a mission shell from the bridge's `startMission` (personal secrets + checkpoint) and turns a shell back into a checkpoint.

**Step 4 (game screen)**

- Route `app/linux/[missionId]/page.tsx`: static params from the missions, `params` read inside `<Suspense>` (Next.js instant navigation), unknown ids give a 404.
- `src/games/linux/game-store.ts`: one Zustand store per mission screen (shell, dialogue, hints, password, victory, checkpoints). The UI only talks to this store.
- Live map = "fog of war" (`map-model.ts`): it shows only what the player discovered (`ls` lists a folder, `ls -a` its hidden files, `cd`, `cat`, `find`, files created). The PRD's "target highlighted" is replaced by this, so the map never gives the answer away. The map is saved in the checkpoint.
- Terminal: xterm.js draws, `Terminal.tsx` is the line editor (cursor, history, Tab via `completion.ts`, green/red command word, Ctrl+C copy when text is selected).
- New mission field `objective`: the goal in one line for the top bar.
- Fonts: JetBrains Mono (terminal, text) and Pixelify Sans (titles, buttons; placeholder until the club picks a title font), self-hosted by `next/font`.
- The penguin is a placeholder SVG with the 8 moods (`ui/Penguin.tsx`), to be replaced by Rive art.
