import type { Lang } from '@/src/shared/i18n/text';
import type { Vfs } from './vfs/vfs';

export interface User {
  name: string;
  /** The first group is the primary group, used for new files. */
  groups: string[];
  home: string;
}

export type ErrorKind =
  | 'not_found'
  | 'permission_denied'
  | 'not_a_directory'
  | 'is_a_directory'
  | 'already_exists'
  | 'not_empty'
  | 'invalid_argument'
  | 'operation_not_permitted'
  | 'command_not_found'
  | 'usage'
  | 'syntax'
  | 'refused';

/** Real Linux wording, so the skills transfer. */
const ERROR_TEXT: Record<ErrorKind, string> = {
  not_found: 'No such file or directory',
  permission_denied: 'Permission denied',
  not_a_directory: 'Not a directory',
  is_a_directory: 'Is a directory',
  already_exists: 'File exists',
  not_empty: 'Directory not empty',
  invalid_argument: 'Invalid argument',
  operation_not_permitted: 'Operation not permitted',
  command_not_found: 'command not found',
  usage: 'Invalid usage',
  syntax: 'Syntax error',
  refused: 'Refused',
};

export function errorText(kind: ErrorKind): string {
  return ERROR_TEXT[kind];
}

export type VfsResult<T> = { ok: true; value: T } | { ok: false; error: ErrorKind };

export function ok<T>(value: T): VfsResult<T> {
  return { ok: true, value };
}

export function fail<T = never>(error: ErrorKind): VfsResult<T> {
  return { ok: false, error };
}

/** Everything a command can read or change. */
export interface ShellState {
  vfs: Vfs;
  cwd: string;
  user: User;
  history: string[];
  lang: Lang;
  /** Number of sudo lines in a row, for the sudo_spam reaction. */
  sudoStreak: number;
}
