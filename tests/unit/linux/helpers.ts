import type { EngineEvent } from '@/src/games/linux/engine/events';
import { createShell, type ShellOptions } from '@/src/games/linux/engine/shell';
import type { FsSpec } from '@/src/games/linux/engine/vfs/spec';

export const HOME = '/home/intern';

export function makeShell(filesystem: FsSpec = {}, options: Partial<ShellOptions> = {}) {
  return createShell({ filesystem, startDir: HOME, ...options });
}

/** Shell plus every event it emits, in order. */
export function recordingShell(filesystem: FsSpec = {}, options: Partial<ShellOptions> = {}) {
  const shell = makeShell(filesystem, options);
  const events: EngineEvent[] = [];
  shell.events.on('*', (event) => events.push(event));
  return { shell, events };
}
