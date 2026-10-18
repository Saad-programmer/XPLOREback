import { createStore, type StoreApi } from 'zustand/vanilla';
import type { ProgressStore, SubmitOutcome } from '@/src/shared/progress/progress-store';
import type { LocalizedText } from '@/src/shared/i18n/text';
import type { DialogueLine, Mission, Mood } from './content/schema';
import type { EventOf } from './engine/events';
import { passwordsOf } from './engine/goals';
import type { RunResult, Shell } from './engine/shell';
import { initialKnown, isFsChange, revealAfterLine } from './map-model';
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
  wrongPassword: boolean;
  victory: Victory | null;

  start(options?: { fresh?: boolean }): Promise<void>;
  /** Runs one terminal line. Returns null when no mission is running. */
  run(line: string): RunResult | null;
  submitPassword(value: string): Promise<boolean>;
  showHint(): void;
  nextLine(): void;
  setDialogueHidden(hidden: boolean): void;
  getShell(): Shell | null;
  dispose(): void;
}

export type GameStore = StoreApi<GameState>;

interface Dependencies {
  mission: Mission;
  progress: ProgressStore;
  now?: () => Date;
}

const line = (mood: Mood, text: LocalizedText): DialogueLine => ({ mood, text });

export function createGameStore({
  mission,
  progress,
  now = () => new Date(),
}: Dependencies): GameStore {
  let shell: Shell | null = null;
  // Filled by start(), which runs in the browser: no clock read while prerendering.
  let meta: MissionMeta = { hintsUsed: 0, attempts: 0, startedAt: '' };
  let shortestCmdLen: number | null = null;
  let dialogueId = 0;

  return createStore<GameState>()((set, get) => {
    const say = (kind: Dialogue['kind'], lines: DialogueLine[]) =>
      set({ dialogue: { id: ++dialogueId, kind, lines, index: 0 }, dialogueHidden: false });

    const saveCheckpoint = () => {
      if (!shell || get().phase !== 'playing') return;
      progress
        .getState()
        .recordCheckpoint(toCheckpoint(shell, mission, meta, { map: [...get().known] }, now()));
    };

    const win = async (answer: string | null) => {
      set({ phase: 'won', victory: { outcome: null, hintsUsed: meta.hintsUsed } });
      say('victory', mission.victory);
      const timeS = Math.round((now().getTime() - Date.parse(meta.startedAt)) / 1000);
      try {
        const outcome = await progress.getState().submitMission('linux', mission.id, answer, {
          hintsUsed: meta.hintsUsed,
          attempts: Math.max(meta.attempts, 1),
          timeS,
          shortestCmdLen,
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
      wrongPassword: false,
      victory: null,

      async start(options = {}) {
        set({ phase: 'loading', victory: null, wrongPassword: false });
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
          }));
          if (created.restored) say('info', [line('happy', UI.welcomeBack)]);
          else say('briefing', mission.briefing);
          if (options.fresh) saveCheckpoint();
        } catch (error) {
          console.error('[labs] could not start the mission', error);
          set({ phase: 'error' });
        }
      },

      run(input) {
        if (!shell || get().phase === 'loading' || get().phase === 'error') return null;
        const cwdBefore = shell.cwd();
        let command: EventOf<'command'> | null = null;
        const changes: EventOf<'fs_changed'>[] = [];
        const stop = shell.events.on('*', (event) => {
          if (event.type === 'command') command = event;
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

        const reaction = mission.reactions.find((r) => r.on === input.trim());
        if (reaction) say('reaction', [line(reaction.mood, reaction.text)]);

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
          say('hint', [line('thinking', hints[hints.length - 1]), line('neutral', UI.noMoreHints)]);
          return;
        }
        say('hint', [line('thinking', hints[meta.hintsUsed])]);
        meta.hintsUsed++;
        set({ hintsUsed: meta.hintsUsed });
        saveCheckpoint();
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

      getShell: () => shell,

      dispose() {
        shell = null;
      },
    };
  });
}

/** True when the mission is won by typing a password (shows the password box). */
export function needsPassword(mission: Mission): boolean {
  return passwordsOf(mission.goal).length > 0;
}
