import { pickText, type Lang } from '@/src/shared/i18n/text';
import { errorText, type ErrorKind } from '../types';
import type { Command, CommandContext, CommandStatus } from './types';

export const SUCCESS: CommandStatus = { exitCode: 0 };

export function failure(errorKind: ErrorKind, exitCode = 1): CommandStatus {
  return { exitCode, errorKind };
}

export function statusOf(failed: ErrorKind | undefined): CommandStatus {
  return failed ? failure(failed) : SUCCESS;
}

export function formatUsage(command: Command, lang: Lang): string {
  return `Usage: ${command.help.usage}\n${pickText(command.help.summary, lang)}\n`;
}

export interface ParsedArgs {
  flags: Set<string>;
  values: Map<string, string>;
  operands: string[];
}

/**
 * GNU-style short options: `-la` = `-l -a`, `-n 5` = `-n5`, `--` ends options.
 * Prints the real error and returns null on an unknown option.
 */
export function parseArgs(
  ctx: CommandContext,
  spec: { flags?: string; values?: string },
  args = ctx.args,
): ParsedArgs | null {
  const flags = new Set<string>();
  const values = new Map<string, string>();
  const operands: string[] = [];
  const tryHelp = `Try '${ctx.name} --help' for more information.\n`;
  let onlyOperands = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (onlyOperands || arg === '-' || !arg.startsWith('-')) {
      operands.push(arg);
      continue;
    }
    if (arg === '--') {
      onlyOperands = true;
      continue;
    }
    if (arg.startsWith('--')) {
      ctx.err(`${ctx.name}: unrecognized option '${arg}'\n${tryHelp}`);
      return null;
    }
    for (let j = 1; j < arg.length; j++) {
      const letter = arg[j];
      if (spec.values?.includes(letter)) {
        const value = arg.slice(j + 1) || args[++i];
        if (value === undefined) {
          ctx.err(`${ctx.name}: option requires an argument -- '${letter}'\n${tryHelp}`);
          return null;
        }
        values.set(letter, value);
        break;
      }
      if (!spec.flags?.includes(letter)) {
        ctx.err(`${ctx.name}: invalid option -- '${letter}'\n${tryHelp}`);
        return null;
      }
      flags.add(letter);
    }
  }
  return { flags, values, operands };
}

/** Lines of a text, without the empty string after the last newline. */
export function splitLines(text: string): string[] {
  if (!text) return [];
  return (text.endsWith('\n') ? text.slice(0, -1) : text).split('\n');
}

export function joinLines(lines: string[]): string {
  return lines.length ? `${lines.join('\n')}\n` : '';
}

export interface Source {
  /** null for standard input. */
  name: string | null;
  content: string;
}

/**
 * Reads the files given as operands, or standard input when there are none.
 * Prints an error for each file that cannot be read.
 */
export function readSources(
  ctx: CommandContext,
  operands: string[],
  formatError: (operand: string, kind: ErrorKind) => string = (operand, kind) =>
    `${ctx.name}: ${operand}: ${errorText(kind)}`,
): { sources: Source[]; failed?: ErrorKind } {
  if (operands.length === 0) return { sources: [{ name: null, content: ctx.stdin ?? '' }] };
  const sources: Source[] = [];
  let failed: ErrorKind | undefined;
  for (const operand of operands) {
    if (operand === '-') {
      sources.push({ name: '-', content: ctx.stdin ?? '' });
      continue;
    }
    const read = ctx.shell.vfs.readFile(ctx.resolve(operand), ctx.shell.user);
    if (read.ok) {
      sources.push({ name: operand, content: read.value });
    } else {
      ctx.err(`${formatError(operand, read.error)}\n`);
      failed ??= read.error;
    }
  }
  return { sources, failed };
}

/** Shell-style pattern (`*`, `?`, `[abc]`, `[!abc]`) as an anchored regular expression. */
export function globToRegExp(pattern: string, ignoreCase = false): RegExp {
  let source = '';
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i];
    if (ch === '*') {
      source += '.*';
    } else if (ch === '?') {
      source += '.';
    } else if (ch === '[' && pattern.indexOf(']', i + 2) > 0) {
      const end = pattern.indexOf(']', i + 2);
      let body = pattern.slice(i + 1, end).replace(/\\/g, '\\\\');
      if (body.startsWith('!')) body = `^${body.slice(1)}`;
      source += `[${body}]`;
      i = end;
    } else {
      source += ch.replace(/[.+^${}()|[\]\\/]/g, '\\$&');
    }
  }
  return new RegExp(`^${source}$`, ignoreCase ? 'i' : '');
}

/** Last part of an operand as typed, e.g. `docs/` -> `docs`, `.` -> `.`. */
export function lastSegment(operand: string): string {
  const trimmed = operand.replace(/\/+$/, '');
  if (!trimmed) return '/';
  return trimmed.slice(trimmed.lastIndexOf('/') + 1);
}
