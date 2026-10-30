import type { Pipeline } from './parser/parser';
import { applySecrets } from './secrets';
import { resolvePath } from './vfs/path';
import type { Vfs } from './vfs/vfs';

export type Goal =
  /** The player submits a value, usually "{{password}}". */
  | { type: 'password'; value: string }
  | { type: 'file_exists'; path: string; nodeType?: 'file' | 'dir' }
  /** The path must be gone (e.g. files the player had to delete). */
  | { type: 'file_absent'; path: string }
  | { type: 'file_content'; path: string; equals?: string; contains?: string }
  | { type: 'cwd'; path: string }
  /** Octal permissions, e.g. "644". */
  | { type: 'permission'; path: string; mode: string }
  /** The last line succeeded and used this command and/or a pipe this long. */
  | { type: 'command_used'; name?: string; minPipeLength?: number }
  | { type: 'all'; goals: Goal[] };

export interface GoalContext {
  vfs: Vfs;
  cwd: string;
  home: string;
  /** Last accepted answer for password goals. */
  answer: string | null;
  lastLine: { pipeline: Pipeline; exitCode: number } | null;
}

/** Goal paths are relative to the player's home (`~/x`, `x` and `/home/intern/x` all work). */
export function isGoalMet(goal: Goal, ctx: GoalContext): boolean {
  const resolve = (path: string) => resolvePath(path, ctx.home, ctx.home);
  switch (goal.type) {
    case 'password':
      return ctx.answer !== null && ctx.answer.trim() === goal.value.trim();
    case 'file_exists': {
      const node = ctx.vfs.stat(resolve(goal.path));
      return node !== null && (!goal.nodeType || node.type === goal.nodeType);
    }
    case 'file_absent':
      return ctx.vfs.stat(resolve(goal.path)) === null;
    case 'file_content': {
      const node = ctx.vfs.stat(resolve(goal.path));
      if (node?.type !== 'file') return false;
      if (goal.equals !== undefined && node.content.trimEnd() !== goal.equals.trimEnd())
        return false;
      if (goal.contains !== undefined && !node.content.includes(goal.contains)) return false;
      return true;
    }
    case 'cwd':
      return ctx.cwd === resolve(goal.path);
    case 'permission': {
      const node = ctx.vfs.stat(resolve(goal.path));
      return node !== null && (node.mode & 0o777) === parseInt(goal.mode, 8);
    }
    case 'command_used': {
      const last = ctx.lastLine;
      if (!last || last.exitCode !== 0) return false;
      const { commands } = last.pipeline;
      if (goal.name && !commands.some((command) => command.name === goal.name)) return false;
      return commands.length >= (goal.minPipeLength ?? 1);
    }
    case 'all':
      return goal.goals.every((inner) => isGoalMet(inner, ctx));
  }
}

/** Password values of a goal (including inside 'all'). */
export function passwordsOf(goal: Goal): string[] {
  if (goal.type === 'password') return [goal.value];
  if (goal.type === 'all') return goal.goals.flatMap(passwordsOf);
  return [];
}

/** Replaces `{{name}}` in every text field of a goal. */
export function goalWithSecrets(goal: Goal, secrets: Record<string, string>): Goal {
  const fill = (text: string) => applySecrets(text, secrets);
  switch (goal.type) {
    case 'password':
      return { ...goal, value: fill(goal.value) };
    case 'file_exists':
    case 'file_absent':
    case 'cwd':
      return { ...goal, path: fill(goal.path) };
    case 'file_content':
      return {
        ...goal,
        path: fill(goal.path),
        equals: goal.equals === undefined ? undefined : fill(goal.equals),
        contains: goal.contains === undefined ? undefined : fill(goal.contains),
      };
    case 'permission':
      return { ...goal, path: fill(goal.path) };
    case 'command_used':
      return goal;
    case 'all':
      return { ...goal, goals: goal.goals.map((inner) => goalWithSecrets(inner, secrets)) };
  }
}
