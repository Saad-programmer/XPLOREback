import type { LocalizedText } from '@/src/shared/i18n/text';
import type { EngineEvent } from '../events';
import type { ErrorKind, ShellState } from '../types';
import type { CommandRegistry } from './registry';

export interface CommandContext {
  /** Name the player typed (can be an alias, e.g. vi). */
  name: string;
  args: string[];
  /** Output of the previous command in a pipe, null when there is none. */
  stdin: string | null;
  /** False when the output goes to a pipe or a file (ls then prints one name per line). */
  isTty: boolean;
  shell: ShellState;
  out(text: string): void;
  err(text: string): void;
  emit(event: EngineEvent): void;
  /** Absolute path of what the player typed, relative to the current folder. */
  resolve(path: string): string;
  commands: CommandRegistry;
  manPages: Record<string, LocalizedText>;
}

export interface CommandStatus {
  exitCode: number;
  errorKind?: ErrorKind;
}

export interface Command {
  name: string;
  aliases?: string[];
  help: { usage: string; summary: LocalizedText };
  /** When true, `--help` is passed to the command instead of printing help (echo). */
  rawArgs?: boolean;
  run(ctx: CommandContext): CommandStatus;
}
