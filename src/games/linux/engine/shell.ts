import type { Lang, LocalizedText } from '@/src/shared/i18n/text';
import { createRegistry } from './commands';
import { EventBus } from './events';
import { goalWithSecrets, isGoalMet, passwordsOf, type Goal } from './goals';
import { runPipeline, type OutputChunk } from './interpreter';
import { parse, type Pipeline } from './parser/parser';
import type { ShellState, User } from './types';
import { resolvePath } from './vfs/path';
import { buildVfs, type FsSpec } from './vfs/spec';
import { Vfs, type SerializedNode } from './vfs/vfs';

export interface ShellOptions {
  filesystem: FsSpec;
  /** Folder the player starts in (`~` works). */
  startDir: string;
  /** Shell user name. The player never gets root. */
  user?: string;
  goal?: Goal;
  missionId?: string;
  /** Personal values for `{{name}}` placeholders. */
  secrets?: Record<string, string>;
  lang?: Lang;
  /** Extra man pages from content files. They win over the built-in help. */
  manPages?: Record<string, LocalizedText>;
  /** Restores a saved in-progress state instead of the starting file system. */
  restore?: ShellSnapshot;
  clock?: () => number;
}

/** In-progress state, saved after each command (checkpoint). */
export interface ShellSnapshot {
  vfs: SerializedNode;
  cwd: string;
  history: string[];
  answer: string | null;
  goalReached: boolean;
}

export interface RunResult {
  chunks: OutputChunk[];
  stdout: string;
  stderr: string;
  exitCode: number;
  goalReached: boolean;
}

export interface Shell {
  readonly events: EventBus;
  readonly user: User;
  readonly vfs: Vfs;
  cwd(): string;
  history(): readonly string[];
  /** Runs one input line. */
  run(line: string): RunResult;
  /** For password goals. */
  submitAnswer(answer: string): { correct: boolean; goalReached: boolean };
  isGoalReached(): boolean;
  setLang(lang: Lang): void;
  /** Every command name the player can type. */
  commandNames(): string[];
  snapshot(): ShellSnapshot;
}

export function createShell(options: ShellOptions): Shell {
  const name = options.user ?? 'intern';
  const user: User = { name, groups: [name], home: `/home/${name}` };
  const secrets = options.secrets ?? {};
  const goal = options.goal ? goalWithSecrets(options.goal, secrets) : null;
  const restore = options.restore;
  const vfs = restore
    ? Vfs.deserialize(restore.vfs)
    : buildVfs(options.filesystem, user, { secrets, clock: options.clock });

  const state: ShellState = {
    vfs,
    cwd: restore?.cwd ?? resolvePath(options.startDir, user.home, user.home),
    user,
    history: [...(restore?.history ?? [])],
    lang: options.lang ?? 'en',
    sudoStreak: 0,
  };
  const events = new EventBus();
  const commands = createRegistry();
  const manPages = options.manPages ?? {};
  let answer = restore?.answer ?? null;
  let goalReached = restore?.goalReached ?? false;

  const checkGoal = (lastLine: { pipeline: Pipeline; exitCode: number } | null) => {
    if (goalReached || !goal) return;
    if (!isGoalMet(goal, { vfs, cwd: state.cwd, home: user.home, answer, lastLine })) return;
    goalReached = true;
    events.emit({ type: 'goal_reached', missionId: options.missionId ?? '' });
  };

  const run = (line: string): RunResult => {
    if (line.trim()) state.history.push(line);
    const parsed = parse(line, { HOME: user.home, USER: user.name, PWD: state.cwd });

    if (!parsed.ok) {
      const stderr = `${parsed.message}\n`;
      events.emit({
        type: 'command',
        raw: line.trim(),
        name: '',
        names: [],
        args: [],
        exitCode: 2,
        errorKind: 'syntax',
        pipeLength: 0,
      });
      return {
        chunks: [{ stream: 'err', text: stderr }],
        stdout: '',
        stderr,
        exitCode: 2,
        goalReached,
      };
    }
    const { pipeline } = parsed;
    if (!pipeline) return { chunks: [], stdout: '', stderr: '', exitCode: 0, goalReached };

    if (pipeline.commands[0].name !== 'sudo') state.sudoStreak = 0;
    const result = runPipeline(pipeline, {
      state,
      commands,
      manPages,
      emit: (e) => events.emit(e),
    });
    events.emit({
      type: 'command',
      raw: pipeline.raw,
      name: pipeline.commands[0].name,
      names: pipeline.commands.map((command) => command.name),
      args: pipeline.commands[0].args,
      exitCode: result.exitCode,
      errorKind: result.errorKind,
      pipeLength: pipeline.commands.length,
      redirect: pipeline.redirect?.op,
    });
    checkGoal({ pipeline, exitCode: result.exitCode });

    const text = (stream: OutputChunk['stream']) =>
      result.chunks
        .filter((chunk) => chunk.stream === stream)
        .map((chunk) => chunk.text)
        .join('');
    return {
      chunks: result.chunks,
      stdout: text('out'),
      stderr: text('err'),
      exitCode: result.exitCode,
      goalReached,
    };
  };

  return {
    events,
    user,
    vfs,
    cwd: () => state.cwd,
    history: () => state.history,
    run,
    submitAnswer(value) {
      const correct = !!goal && passwordsOf(goal).some((p) => p.trim() === value.trim());
      if (correct) {
        answer = value;
        checkGoal(null);
      }
      return { correct, goalReached };
    },
    isGoalReached: () => goalReached,
    setLang(lang) {
      state.lang = lang;
    },
    commandNames: () => commands.names(),
    snapshot: () => ({
      vfs: vfs.serialize(),
      cwd: state.cwd,
      history: [...state.history],
      answer,
      goalReached,
    }),
  };
}
