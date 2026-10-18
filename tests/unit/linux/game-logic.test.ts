import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { complete } from '@/src/games/linux/completion';
import { getMission } from '@/src/games/linux/content';
import { createGameStore } from '@/src/games/linux/game-store';
import { buildMapTree, initialKnown, revealAfterLine } from '@/src/games/linux/map-model';
import type { EventOf } from '@/src/games/linux/engine/events';
import { createProgressStore } from '@/src/shared/progress/progress-store';
import { MockBridge } from '@/src/shared/bridge/mock-bridge';
import { memoryStore } from '@/src/shared/storage';
import { HOME, makeShell } from './helpers';

const fs = {
  [HOME]: {
    'notes.txt': 'n',
    'notebook.md': 'b',
    '.secret': 's',
    docs: { type: 'dir' as const, children: { 'a.txt': 'a', deep: { type: 'dir' as const } } },
  },
};

describe('Tab completion', () => {
  const shell = makeShell(fs);

  it('completes command names', () => {
    expect(complete(shell, 'who')).toEqual({ line: 'whoami ', candidates: [] });
    expect(complete(shell, 'ls | so')).toEqual({ line: 'ls | sort ', candidates: [] });
    expect(complete(shell, 'h').candidates).toEqual(['head', 'help', 'history']);
  });

  it('completes files, folders and paths', () => {
    expect(complete(shell, 'cat notes')).toEqual({ line: 'cat notes.txt ', candidates: [] });
    expect(complete(shell, 'cd do')).toEqual({ line: 'cd docs/', candidates: [] });
    expect(complete(shell, 'cat docs/a')).toEqual({ line: 'cat docs/a.txt ', candidates: [] });
    expect(complete(shell, 'cat not')).toEqual({
      line: 'cat note',
      candidates: ['notebook.md', 'notes.txt'],
    });
  });

  it('only completes hidden files after a dot', () => {
    expect(complete(shell, 'cat .s')).toEqual({ line: 'cat .secret ', candidates: [] });
    expect(complete(shell, 'cat s')).toEqual({ line: 'cat s', candidates: [] });
  });
});

describe('live map', () => {
  const reveal = (line: string, shell = makeShell(fs), known = initialKnown(HOME)) => {
    const cwdBefore = shell.cwd();
    let command: EventOf<'command'> | null = null;
    const changes: EventOf<'fs_changed'>[] = [];
    shell.events.on('command', (e) => (command = e));
    shell.events.on('fs_changed', (e) => changes.push(e));
    shell.run(line);
    return revealAfterLine(
      known,
      shell.vfs,
      { cwdBefore, cwdAfter: shell.cwd(), home: HOME },
      command,
      changes,
    );
  };

  it('starts with only the path to the current folder', () => {
    const shell = makeShell(fs);
    const tree = buildMapTree(shell.vfs, initialKnown(HOME));
    expect(tree.children[0].children[0]).toMatchObject({
      path: HOME,
      unexplored: true,
      children: [],
    });
  });

  it('reveals listed files, hidden ones only with -a', () => {
    expect([...reveal('ls')].sort()).toEqual(
      ['/', '/home', HOME, `${HOME}/docs`, `${HOME}/notebook.md`, `${HOME}/notes.txt`].sort(),
    );
    expect(reveal('ls -a')).toContain(`${HOME}/.secret`);
  });

  it('reveals folders walked into and files read or created', () => {
    expect(reveal('cd docs/deep')).toContain(`${HOME}/docs/deep`);
    expect(reveal('cat docs/a.txt')).toContain(`${HOME}/docs/a.txt`);
    expect(reveal('touch new.txt')).toContain(`${HOME}/new.txt`);
    expect(reveal('find docs')).toContain(`${HOME}/docs/deep`);
  });

  it('forgets deleted files and follows moved ones', () => {
    const shell = makeShell(fs);
    const known = reveal('ls', shell);
    expect(reveal('rm notes.txt', shell, known)).not.toContain(`${HOME}/notes.txt`);
    const moved = reveal('mv notebook.md docs', shell, known);
    expect(moved).toContain(`${HOME}/docs/notebook.md`);
    expect(moved).not.toContain(`${HOME}/notebook.md`);
  });
});

describe('game session', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function setup(missionId = 'archive-hidden-scroll') {
    const store = memoryStore();
    const progress = createProgressStore({ bridge: new MockBridge(store), store });
    const game = createGameStore({ mission: getMission(missionId)!, progress });
    return { store, progress, game, state: () => game.getState() };
  }

  it('starts with the briefing', async () => {
    const { state } = setup();
    await state().start();
    expect(state()).toMatchObject({
      phase: 'playing',
      cwd: HOME,
      dialogue: { kind: 'briefing', index: 0 },
    });
    state().nextLine();
    expect(state().dialogue?.index).toBe(1);
  });

  it('plays mission 3: hints, reaction, wrong and right password, points', async () => {
    const { state, progress } = setup();
    await state().start();
    state().showHint();
    expect(state()).toMatchObject({ hintsUsed: 1, dialogue: { kind: 'hint' } });

    state().run('ls -a');
    expect(state().known).toContain(`${HOME}/.secret_scroll`);
    const password = state().run('cat .secret_scroll')!.stdout.trim();

    expect(await state().submitPassword('nope')).toBe(false);
    expect(state()).toMatchObject({ wrongPassword: true, dialogue: { kind: 'info' } });

    expect(await state().submitPassword(password)).toBe(true);
    expect(state()).toMatchObject({ phase: 'won', dialogue: { kind: 'victory' } });
    expect(state().victory?.outcome).toMatchObject({ kind: 'done', result: { pointsAwarded: 10 } });
    expect(progress.getState().player?.points).toBe(10);
  });

  it('shows mission reactions', async () => {
    const { state } = setup();
    await state().start();
    state().run('rm .secret_scroll');
    expect(state().dialogue).toMatchObject({ kind: 'reaction', lines: [{ mood: 'shocked' }] });
  });

  it('comes back after a refresh with the map and folder, and restarts fresh', async () => {
    const first = setup('wake-up-first-door');
    await first.state().start();
    first.state().run('ls');
    first.state().run('cd door-2');

    const progress = createProgressStore({
      bridge: new MockBridge(first.store),
      store: first.store,
    });
    const again = createGameStore({ mission: getMission('wake-up-first-door')!, progress });
    await again.getState().start();
    expect(again.getState()).toMatchObject({ cwd: `${HOME}/door-2`, dialogue: { kind: 'info' } });
    expect(again.getState().known).toContain(`${HOME}/door-1`);

    await again.getState().start({ fresh: true });
    expect(again.getState().cwd).toBe(HOME);
    expect(again.getState().dialogue?.kind).toBe('briefing');
  });
});
