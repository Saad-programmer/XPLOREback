import type { LocalizedText } from '@/src/shared/i18n/text';
import type { CommandRegistry } from './commands/registry';
import type { CommandStatus } from './commands/types';
import { formatUsage } from './commands/util';
import type { EngineEvent } from './events';
import type { Pipeline, SimpleCommand } from './parser/parser';
import { errorText, type ErrorKind, type ShellState } from './types';
import { resolvePath } from './vfs/path';

export interface OutputChunk {
  stream: 'out' | 'err';
  text: string;
}

export interface PipelineResult {
  /** In the order the player sees them. */
  chunks: OutputChunk[];
  exitCode: number;
  /** First error of the line, used for reactions. */
  errorKind?: ErrorKind;
}

export interface InterpreterEnv {
  state: ShellState;
  commands: CommandRegistry;
  manPages: Record<string, LocalizedText>;
  emit: (event: EngineEvent) => void;
}

interface CommandIo {
  stdin: string | null;
  isTty: boolean;
  out: (text: string) => void;
  err: (text: string) => void;
}

function runCommand(command: SimpleCommand, io: CommandIo, env: InterpreterEnv): CommandStatus {
  const { state } = env;
  const found = env.commands.get(command.name);
  if (!found) {
    io.err(`${command.name}: command not found\n`);
    return { exitCode: 127, errorKind: 'command_not_found' };
  }
  if (!found.rawArgs && command.args.includes('--help')) {
    io.out(formatUsage(found, state.lang));
    return { exitCode: 0 };
  }
  return found.run({
    name: command.name,
    args: command.args,
    stdin: io.stdin,
    isTty: io.isTty,
    shell: state,
    out: io.out,
    err: io.err,
    emit: env.emit,
    resolve: (path) => resolvePath(path, state.cwd, state.user.home),
    commands: env.commands,
    manPages: env.manPages,
  });
}

/**
 * Runs a pipeline: the output of each command is the input of the next one.
 * Like bash, the redirect file is opened (and truncated by `>`) before the commands run.
 */
export function runPipeline(pipeline: Pipeline, env: InterpreterEnv): PipelineResult {
  const { state } = env;
  const chunks: OutputChunk[] = [];
  const err = (text: string) => chunks.push({ stream: 'err', text });
  let errorKind: ErrorKind | undefined;
  let exitCode = 0;

  let redirectPath: string | null = null;
  if (pipeline.redirect) {
    const { op, target } = pipeline.redirect;
    redirectPath = resolvePath(target, state.cwd, state.user.home);
    const opened = state.vfs.writeFile(redirectPath, '', state.user, op === '>>');
    if (!opened.ok) {
      err(`bash: ${target}: ${errorText(opened.error)}\n`);
      return { chunks, exitCode: 1, errorKind: opened.error };
    }
    if (opened.value.created) {
      env.emit({ type: 'fs_changed', change: 'create', path: redirectPath, nodeType: 'file' });
    }
  }

  let stdin: string | null = null;
  pipeline.commands.forEach((command, index) => {
    let out = '';
    const isLast = index === pipeline.commands.length - 1;
    const status = runCommand(
      command,
      { stdin, isTty: isLast && !redirectPath, out: (text) => (out += text), err },
      env,
    );
    errorKind ??= status.errorKind;
    exitCode = status.exitCode;
    stdin = out;
  });

  const output: string = stdin ?? '';
  if (redirectPath) {
    state.vfs.writeFile(redirectPath, output, state.user, true);
    env.emit({ type: 'fs_changed', change: 'modify', path: redirectPath, nodeType: 'file' });
  } else if (output) {
    chunks.push({ stream: 'out', text: output });
  }
  return { chunks, exitCode, errorKind };
}
