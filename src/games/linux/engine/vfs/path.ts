/** Resolves `.` and `..` and removes empty segments. Input must be absolute. */
export function normalize(path: string): string {
  const parts: string[] = [];
  for (const part of path.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') parts.pop();
    else parts.push(part);
  }
  return `/${parts.join('/')}`;
}

/** Turns what the player typed into an absolute path (handles `~`). */
export function resolvePath(input: string, cwd: string, home: string): string {
  let path = input;
  if (path === '~' || path.startsWith('~/')) path = home + path.slice(1);
  return normalize(path.startsWith('/') ? path : `${cwd}/${path}`);
}

export function dirname(path: string): string {
  const index = path.lastIndexOf('/');
  return index <= 0 ? '/' : path.slice(0, index);
}

export function basename(path: string): string {
  if (path === '/') return '/';
  return path.slice(path.lastIndexOf('/') + 1);
}

export function joinPath(dir: string, name: string): string {
  return dir === '/' ? `/${name}` : `${dir}/${name}`;
}

/** True when `path` is `dir` or somewhere below it. */
export function isInside(path: string, dir: string): boolean {
  return dir === '/' || path === dir || path.startsWith(`${dir}/`);
}

export function segments(path: string): string[] {
  return path.split('/').filter(Boolean);
}
