import { errorText, type ErrorKind } from '../types';
import type { Command } from './types';
import { failure, statusOf } from './util';

const PERMISSION_BIT: Record<string, number> = { r: 4, w: 2, x: 1 };
const WHO_SHIFT: Record<string, number> = { u: 6, g: 3, o: 0 };

/** Applies a numeric (`640`) or symbolic (`u+x,go-w`) mode. Returns null if invalid. */
export function applyMode(spec: string, current: number): number | null {
  if (/^[0-7]{1,4}$/.test(spec)) return parseInt(spec, 8);
  let mode = current;
  for (const clause of spec.split(',')) {
    const match = /^([ugoa]*)([+\-=])([rwx]*)$/.exec(clause);
    if (!match) return null;
    const [, who, op, permissions] = match;
    const targets = who === '' || who.includes('a') ? 'ugo' : who;
    let bits = 0;
    for (const permission of permissions) bits |= PERMISSION_BIT[permission];
    for (const target of new Set(targets)) {
      const shift = WHO_SHIFT[target];
      const value = bits << shift;
      if (op === '+') mode |= value;
      else if (op === '-') mode &= ~value;
      else mode = (mode & ~(7 << shift)) | value;
    }
  }
  return mode;
}

export const chmod: Command = {
  name: 'chmod',
  help: {
    usage: 'chmod mode file...',
    summary: {
      en: 'Change who can read (r), write (w) or run (x) a file. Examples: chmod 644 notes.txt, chmod u+r secret.txt',
      fr: 'Change qui peut lire (r), écrire (w) ou exécuter (x) un fichier. Exemples : chmod 644 notes.txt, chmod u+r secret.txt',
    },
  },
  run(ctx) {
    // No option parsing: like GNU chmod, "-x" here is a mode, not an option.
    const [spec, ...files] = ctx.args;
    const tryHelp = "Try 'chmod --help' for more information.\n";
    if (spec === undefined) {
      ctx.err(`chmod: missing operand\n${tryHelp}`);
      return failure('usage');
    }
    if (files.length === 0) {
      ctx.err(`chmod: missing operand after '${spec}'\n${tryHelp}`);
      return failure('usage');
    }
    if (applyMode(spec, 0) === null) {
      ctx.err(`chmod: invalid mode: '${spec}'\n${tryHelp}`);
      return failure('usage');
    }

    const { vfs, user } = ctx.shell;
    let failed: ErrorKind | undefined;
    for (const file of files) {
      const path = ctx.resolve(file);
      const found = vfs.lookup(path, user);
      if (!found.ok) {
        ctx.err(`chmod: cannot access '${file}': ${errorText(found.error)}\n`);
        failed ??= found.error;
        continue;
      }
      const changed = vfs.chmod(path, applyMode(spec, found.value.mode) ?? found.value.mode, user);
      if (!changed.ok) {
        ctx.err(`chmod: changing permissions of '${file}': ${errorText(changed.error)}\n`);
        failed ??= changed.error;
        continue;
      }
      ctx.emit({ type: 'fs_changed', change: 'chmod', path, nodeType: found.value.type });
    }
    return statusOf(failed);
  },
};
