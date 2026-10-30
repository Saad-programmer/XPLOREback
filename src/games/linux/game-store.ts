import { createStore, type StoreApi } from 'zustand/vanilla';
import type { ProgressStore, SubmitOutcome } from '@/src/shared/progress/progress-store';
import type { LocalizedText } from '@/src/shared/i18n/text';
import type { DialogueLine, Meme, MemeEvent, Mission, Mood, Reactions } from './content/schema';
import type { EventOf, SpecialKind } from './engine/events';
import { passwordsOf } from './engine/goals';
import type { RunResult, Shell } from './engine/shell';
import { initialKnown, isFsChange, revealAfterLine } from './map-model';
import {
  feedbackForLine,
  memeFor,
  reactionLines,
  type EffectKind,
  type PenguinAct,
  type Random,
  type SoundName,
} from './reactions';
import { createMissionShell, toCheckpoint, type MissionMeta } from './session';
import { UI } from './strings';

export type Phase = 'loading' | 'playing' | 'won' | 'error';

export interface Dialogue {
  /** New for every message, so the dialogue box restarts its typewriter. */
  id: number;
  kind: 'briefing' | 'hint' | 'reaction' | 'victory' | 'info';
  lines: DialogueLine[];
  index: number;
}

export interface Victory {
  outcome: SubmitOutcome | null;
  hintsUsed: number;
}

/** One-shot things the screen shows; the UI clears them when their animation ends. */
export interface Effect {
  id: number;
  kind: EffectKind;
}

export interface ShownMeme {
  id: number;
  sticker: string | null;
}

/** Plays sounds; the UI version respects mute and the meme sounds setting. */
export interface SoundPlayer {
  play(name: SoundName | string, category: 'effect' | 'meme' | 'voice'): void;
}

export interface GameState {
  phase: Phase;
  mission: Mission;
  /** Changes on start and restart, so the terminal remounts with the new shell. */
  sessionId: number;
  cwd: string;
  /** Paths the player has discovered (live map). */
  known: ReadonlySet<string>;
  /** Changes after every line, so the map re-reads the file system. */
  fsVersion: number;
  dialogue: Dialogue | null;
  dialogueHidden: boolean;
  hintsUsed: number;
  /** All hints shown: the hint button now gives the full answer. */
  answerShown: boolean;
  wrongPassword: boolean;
  victory: Victory | null;
  effects: Effect[];
  meme: ShownMeme | null;
  penguin: { id: number; act: PenguinAct } | null;
  /** The fake vim screen is open; the terminal waits until the player types :q! */
  vimOpen: boolean;

  start(options?: { fresh?: boolean }): Promise<void>;
  /** Runs one terminal line. Returns null when no mission is running. */
  run(line: string): RunResult | null;
  submitPassword(value: string): Promise<boolean>;
  /** Next hint, or the full answer once every hint was used. */
  showHint(): void;
  /** Typed in the fake vim. Returns true when it was a way out. */
  vimCommand(command: string): boolean;
  /** The player typed something: resets the idle timer. */
  noteActivity(): void;
  nextLine(): void;
  setDialogueHidden(hidden: boolean): void;
  clearEffect(id: number): void;
  clearMeme(id: number): void;
  clearPenguin(id: number): void;
  getShell(): Shell | null;
  dispose(): void;
}

export type GameStore = StoreApi<GameState>;

interface Dependencies {
  mission: Mission;
  progress: ProgressStore;
  reactions: Reactions;
  memes: readonly Meme[];
  sound?: SoundPlayer;
  random?: Random;
  now?: () => Date;
  /** No typing for this long: the penguin falls asleep (PRD section 6). */
  idleMs?: number;
}

/** Mistakes in a row before the penguin offers a hint (PRD section 5). */
const MISTAKES_BEFORE_HINT = 3;
const VIM_EXITS = new Set([':q!', ':q', ':wq', ':x', ':qa!', ':wq!']);

const line = (mood: Mood, text: LocalizedText): DialogueLine => ({ mood, text });

export function createGameStore({
  mission,
  progress,
  reactions,
  memes,
  sound = { play: () => {} },
  random = Math.random,
  now = () => new Date(),
  idleMs = 60_000,
}: Dependencies): GameStore {
  let shell: Shell | null = null;
  // Filled by start(), which runs in the browser: no clock read while prerendering.
  let meta: MissionMeta = { hintsUsed: 0, attempts: 0, startedAt: '' };
  let shortestCmdLen: number | null = null;
  let nextId = 0;
  let mistakes = 0;
  let idleTimer: ReturnType<typeof setTimeout> | null = null;

  return createStore<GameState>()((set, get) => {
    const say = (kind: Dialogue['kind'], lines: DialogueLine[]) =>
      set({ dialogue: { id: ++nextId, kind, lines, index: 0 }, dialogueHidden: false });

    const addEffect = (kind: EffectKind) =>
      set((s) => ({
        effects: [...s.effects.filter((e) => e.kind !== kind), { id: ++nextId, kind }],
      }));

    const playMeme = (event: MemeEvent) => {
      const meme = memeFor(event, memes, random);
      if (!meme) return;
      if (meme.sound) sound.play(meme.sound, 'meme');
      set({ meme: { id: ++nextId, sticker: meme.sticker ?? null } });
    };

    const actPenguin = (act: PenguinAct) => set({ penguin: { id: ++nextId, act } });

    const saveCheckpoint = () => {
      if (!shell || get().phase !== 'playing') return;
      progress
        .getState()
        .recordCheckpoint(toCheckpoint(shell, mission, meta, { map: [...get().known] }, now()));
    };

    const stopIdle = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = null;
    };

    const armIdle = () => {
      stopIdle();
      if (get().phase !== 'playing') return;
      idleTimer = setTimeout(() => {
        idleTimer = null;
        if (get().phase !== 'playing' || get().vimOpen) return;
        say('reaction', reactionLines(reactions, 'idle', random));
        actPenguin('sleep');
        playMeme('idle_60s');
      }, idleMs);
    };

    const win = async (answer: string | null) => {
      stopIdle();
      set({ phase: 'won', vimOpen: false, victory: { outcome: null, hintsUsed: meta.hintsUsed } });
      say('victory', mission.victory);
      addEffect('confetti');
      actPenguin('dance');
      sound.play('victory', 'effect');
      if (meta.hintsUsed === 0) playMeme('mission_success_no_hint');
      const timeS = Math.round((now().getTime() - Date.parse(meta.startedAt)) / 1000);
      try {
        const outcome = await progress.getState().submitMission('linux', mission.id, answer, {
          hintsUsed: meta.hintsUsed,
          attempts: Math.max(meta.attempts, 1),
          timeS,
          shortestCmdLen,
          commands: shell ? [...shell.history()] : [],
        });
        set({ victory: { outcome, hintsUsed: meta.hintsUsed } });
      } catch (error) {
        console.error('[labs] could not submit the mission', error);
      }
    };

    return {
      phase: 'loading',
      mission,
      sessionId: 0,
      cwd: '/',
      known: new Set(['/']),
      fsVersion: 0,
      dialogue: null,
      dialogueHidden: false,
      hintsUsed: 0,
      answerShown: false,
      wrongPassword: false,
      victory: null,
      effects: [],
      meme: null,
      penguin: null,
      vimOpen: false,

      async start(options = {}) {
        stopIdle();
        set({ phase: 'loading', victory: null, wrongPassword: false, vimOpen: false, effects: [] });
        try {
          const state = progress.getState();
          const start = await state.startMission('linux', mission.id);
          const created = createMissionShell(
            mission,
            options.fresh ? { ...start, checkpoint: null } : start,
            state.settings.language,
          );
          shell = created.shell;
          meta = created.meta;
          shortestCmdLen = null;
          mistakes = 0;
          const savedMap = created.restored
            ? (start.checkpoint?.state as { map?: unknown } | undefined)?.map
            : undefined;
          const known = Array.isArray(savedMap)
            ? new Set(savedMap.filter((path): path is string => typeof path === 'string'))
            : initialKnown(shell.cwd());
          set((s) => ({
            phase: 'playing',
            sessionId: s.sessionId + 1,
            cwd: shell!.cwd(),
            known,
            fsVersion: s.fsVersion + 1,
            hintsUsed: meta.hintsUsed,
            answerShown: false,
          }));
          if (created.restored) say('info', [line('happy', UI.welcomeBack)]);
          else say('briefing', mission.briefing);
          if (options.fresh) saveCheckpoint();
          armIdle();
        } catch (error) {
          console.error('[labs] could not start the mission', error);
          set({ phase: 'error' });
        }
      },

      run(input) {
        if (!shell || get().phase === 'loading' || get().phase === 'error' || get().vimOpen) {
          return null;
        }
        const cwdBefore = shell.cwd();
        let command: EventOf<'command'> | null = null;
        const changes: EventOf<'fs_changed'>[] = [];
        const specials: SpecialKind[] = [];
        const stop = shell.events.on('*', (event) => {
          if (event.type === 'command') command = event;
          else if (event.type === 'special') specials.push(event.kind);
          else if (isFsChange(event)) changes.push(event);
        });
        const result = shell.run(input);
        stop();

        const known = revealAfterLine(
          get().known,
          shell.vfs,
          { cwdBefore, cwdAfter: shell.cwd(), home: shell.user.home },
          command,
          changes,
        );
        set((s) => ({ cwd: shell!.cwd(), known, fsVersion: s.fsVersion + 1 }));

        const feedback = feedbackForLine(command, specials, reactions, random);
        feedback.effects.forEach(addEffect);
        feedback.sounds.forEach((name) => sound.play(name, 'effect'));
        if (feedback.meme) playMeme(feedback.meme);
        if (feedback.penguin) actPenguin(feedback.penguin);
        if (specials.includes('vim_trap')) set({ vimOpen: true });

        // A mission's own reaction wins over the generic one.
        const own = mission.reactions.find((r) => r.on === input.trim());
        if (own) say('reaction', [line(own.mood, own.text)]);
        else if (feedback.dialogue) say('reaction', feedback.dialogue);

        mistakes = feedback.mistake ? mistakes + 1 : 0;
        if (mistakes >= MISTAKES_BEFORE_HINT && !own && !feedback.dialogue) {
          mistakes = 0;
          if (meta.hintsUsed < mission.hints.length) {
            say('reaction', reactionLines(reactions, 'error_streak', random));
          }
        }

        if (get().phase === 'playing') {
          if (result.goalReached) {
            shortestCmdLen = input.trim().length;
            void win(null);
          } else {
            saveCheckpoint();
          }
        }
        return result;
      },

      async submitPassword(value) {
        if (!shell || get().phase !== 'playing' || !value.trim()) return false;
        meta.attempts++;
        const { correct, goalReached } = shell.submitAnswer(value);
        if (!correct) {
          set({ wrongPassword: true });
          say('info', [line('disappointed', UI.wrongPassword)]);
          addEffect('shake');
          sound.play('bonk', 'effect');
          saveCheckpoint();
          return false;
        }
        set({ wrongPassword: false });
        if (goalReached) await win(value.trim());
        else saveCheckpoint();
        return true;
      },

      showHint() {
        if (get().phase !== 'playing') return;
        const { hints } = mission;
        if (meta.hintsUsed >= hints.length) {
          // Giving up: the full answer, and the only place where a mocking meme plays.
          say('hint', [
            line('laughing', UI.answerIntro),
            line('neutral', mission.solution.join('\n')),
          ]);
          set({ answerShown: true });
          playMeme('give_up');
          return;
        }
        say('hint', [line('thinking', hints[meta.hintsUsed])]);
        meta.hintsUsed++;
        mistakes = 0;
        set({ hintsUsed: meta.hintsUsed });
        saveCheckpoint();
      },

      vimCommand(command) {
        if (!get().vimOpen) return false;
        if (!VIM_EXITS.has(command.trim())) return false;
        set({ vimOpen: false });
        say('reaction', [line('proud', UI.vimEscaped)]);
        return true;
      },

      noteActivity() {
        if (get().penguin?.act === 'sleep') set({ penguin: null });
        armIdle();
      },

      nextLine() {
        const { dialogue } = get();
        if (!dialogue) return;
        if (dialogue.index < dialogue.lines.length - 1) {
          set({ dialogue: { ...dialogue, index: dialogue.index + 1 } });
        } else if (dialogue.kind !== 'victory') {
          set({ dialogueHidden: true });
        }
      },

      setDialogueHidden(hidden) {
        set({ dialogueHidden: hidden });
      },

      clearEffect(id) {
        set((s) => ({ effects: s.effects.filter((effect) => effect.id !== id) }));
      },

      clearMeme(id) {
        if (get().meme?.id === id) set({ meme: null });
      },

      clearPenguin(id) {
        if (get().penguin?.id === id) set({ penguin: null });
      },

      getShell: () => shell,

      dispose() {
        stopIdle();
        shell = null;
      },
    };
  });
}

/** True when the mission is won by typing a password (shows the password box). */
export function needsPassword(mission: Mission): boolean {
  return passwordsOf(mission.goal).length > 0;
}
