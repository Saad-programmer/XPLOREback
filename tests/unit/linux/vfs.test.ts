import { describe, expect, it } from 'vitest';
import { basename, dirname, normalize, resolvePath } from '@/src/games/linux/engine/vfs/path';
import { buildVfs } from '@/src/games/linux/engine/vfs/spec';
import { Vfs } from '@/src/games/linux/engine/vfs/vfs';
import type { User } from '@/src/games/linux/engine/types';

const intern: User = { name: 'intern', groups: ['intern'], home: '/home/intern' };

describe('paths', () => {
  it('normalizes . and ..', () => {
    expect(normalize('/a/./b/../c//d/')).toBe('/a/c/d');
    expect(normalize('/../..')).toBe('/');
  });

  it('resolves relative paths and ~', () => {
    expect(resolvePath('docs', '/home/intern', '/home/intern')).toBe('/home/intern/docs');
    expect(resolvePath('..', '/home/intern', '/home/intern')).toBe('/home');
    expect(resolvePath('~/x', '/tmp', '/home/intern')).toBe('/home/intern/x');
    expect(resolvePath('~', '/tmp', '/home/intern')).toBe('/home/intern');
    expect(resolvePath('/etc', '/tmp', '/home/intern')).toBe('/etc');
  });

  it('splits dirname and basename', () => {
    expect(dirname('/a/b')).toBe('/a');
    expect(dirname('/a')).toBe('/');
    expect(basename('/a/b')).toBe('b');
  });
});

describe('buildVfs', () => {
  const vfs = buildVfs(
    {
      '/home/intern': {
        'notes.txt': 'hello',
        '.hidden': { content: 'secret {{password}}', mode: '600' },
        docs: { type: 'dir', children: { 'a.txt': 'A' } },
      },
      '/etc': { passwd: 'root:x:0:0' },
    },
    intern,
    { secrets: { password: 'k7Qx' } },
  );

  it('gives the home to the player and the rest to root', () => {
    expect(vfs.stat('/home/intern')?.owner).toBe('intern');
    expect(vfs.stat('/home/intern/notes.txt')?.owner).toBe('intern');
    expect(vfs.stat('/home')?.owner).toBe('root');
    expect(vfs.stat('/etc/passwd')?.owner).toBe('root');
  });

  it('adds a final newline, applies secrets and modes', () => {
    const hidden = vfs.stat('/home/intern/.hidden');
    expect(hidden?.type === 'file' && hidden.content).toBe('secret k7Qx\n');
    expect(hidden?.mode).toBe(0o600);
    expect(vfs.stat('/home/intern/docs/a.txt')?.type).toBe('file');
  });
});

describe('permissions', () => {
  const vfs = buildVfs(
    {
      '/vault': {
        'secret.txt': { content: 'gold', mode: '600' },
        locked: { type: 'dir', mode: '700', children: { 'x.txt': 'x' } },
      },
    },
    intern,
  );

  it('refuses to read a file owned by root with mode 600', () => {
    expect(vfs.readFile('/vault/secret.txt', intern)).toEqual({
      ok: false,
      error: 'permission_denied',
    });
  });

  it('refuses to walk through a folder without x', () => {
    expect(vfs.lookup('/vault/locked/x.txt', intern)).toEqual({
      ok: false,
      error: 'permission_denied',
    });
  });

  it('refuses to write in a folder owned by root', () => {
    expect(vfs.writeFile('/vault/new.txt', 'x', intern)).toEqual({
      ok: false,
      error: 'permission_denied',
    });
  });

  it('only lets the owner chmod', () => {
    expect(vfs.chmod('/vault/secret.txt', 0o644, intern)).toEqual({
      ok: false,
      error: 'operation_not_permitted',
    });
  });
});

describe('file operations', () => {
  const fresh = () => buildVfs({ '/home/intern': { 'a.txt': 'A', box: { type: 'dir' } } }, intern);

  it('creates parents with mkdir -p and reports created folders', () => {
    const vfs = fresh();
    expect(vfs.mkdir('/home/intern/x/y', intern, true)).toEqual({
      ok: true,
      value: ['/home/intern/x', '/home/intern/x/y'],
    });
    expect(vfs.mkdir('/home/intern/box', intern)).toEqual({ ok: false, error: 'already_exists' });
    expect(vfs.mkdir('/home/intern/no/such', intern)).toEqual({ ok: false, error: 'not_found' });
  });

  it('needs recursive to remove a folder', () => {
    const vfs = fresh();
    expect(vfs.remove('/home/intern/box', intern)).toEqual({ ok: false, error: 'is_a_directory' });
    expect(vfs.remove('/home/intern/box', intern, true).ok).toBe(true);
    expect(vfs.stat('/home/intern/box')).toBeNull();
  });

  it('refuses to move a folder inside itself', () => {
    const vfs = fresh();
    expect(vfs.move('/home/intern/box', '/home/intern/box/inner', intern)).toEqual({
      ok: false,
      error: 'invalid_argument',
    });
  });

  it('copies and moves files', () => {
    const vfs = fresh();
    expect(vfs.copy('/home/intern/a.txt', '/home/intern/box/a.txt', intern).ok).toBe(true);
    expect(vfs.move('/home/intern/a.txt', '/home/intern/b.txt', intern).ok).toBe(true);
    expect(vfs.stat('/home/intern/a.txt')).toBeNull();
    expect(vfs.stat('/home/intern/b.txt')?.name).toBe('b.txt');
    expect(vfs.readFile('/home/intern/box/a.txt', intern)).toEqual({ ok: true, value: 'A\n' });
  });

  it('survives serialize and deserialize', () => {
    const vfs = fresh();
    vfs.writeFile('/home/intern/new.txt', 'hi', intern);
    const copy = Vfs.deserialize(JSON.parse(JSON.stringify(vfs.serialize())));
    expect(copy.readFile('/home/intern/new.txt', intern)).toEqual({ ok: true, value: 'hi' });
    expect(copy.stat('/home/intern/box')?.type).toBe('dir');
  });
});
