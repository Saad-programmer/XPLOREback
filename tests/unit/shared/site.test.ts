import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { checkAbout } from '@/src/games/linux/content/load';
import { GAMES } from '@/src/shared/games';
import { levelOf } from '@/src/shared/site/strings';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('website styles', () => {
  const css = read('app/site.css');

  it('never loads Tailwind Preflight globally (the game screens keep their own styles)', () => {
    expect(css).not.toMatch(/@import\s+['"]tailwindcss['"]/);
    expect(css).not.toMatch(/@import[^;]*preflight/i);
    expect(css).toMatch(/@import 'tailwindcss\/utilities\.css' layer\(utilities\)/);
  });

  it('scopes its reset to the .site wrapper', () => {
    const start = css.indexOf('@layer base {');
    const base = css.slice(start, css.indexOf('\n}\n', start));
    const selectors = base.match(/^\s{2}[^\s@}][^{]*\{/gm) ?? [];
    expect(selectors.length).toBeGreaterThan(0);
    for (const selector of selectors) expect(selector).toContain('.site');
  });

  it('loads site.css before globals.css, so the layer order is declared first', () => {
    const layout = read('app/layout.tsx');
    expect(layout.indexOf("'./site.css'")).toBeLessThan(layout.indexOf("'./globals.css'"));
  });
});

describe('navbar XP bar', () => {
  it('turns server points into a level (display only)', () => {
    expect(levelOf(0)).toEqual({ level: 1, percent: 0, toNext: 100 });
    expect(levelOf(35)).toEqual({ level: 1, percent: 35, toNext: 65 });
    expect(levelOf(250)).toEqual({ level: 3, percent: 50, toNext: 50 });
  });
});

describe('game details content', () => {
  it('accepts a Markdown page with level-2 headings and code placeholders', () => {
    expect(checkAbout('## Story\n\nType `man <command>`.\n', 'about.en.md')).toEqual([]);
  });

  it('rejects empty pages, level-1 headings and raw HTML', () => {
    expect(checkAbout('  \n', 'a.md')).toEqual(['a.md: is empty']);
    expect(checkAbout('# Title\n\n## Part', 'a.md')).toEqual([
      'a.md: do not use "# " headings (the page shows the title)',
    ]);
    expect(checkAbout('## Part\n\nPress <kbd>Tab</kbd>', 'a.md')).toEqual([
      'a.md: raw HTML is not allowed, use Markdown only',
    ]);
    expect(checkAbout('Just text', 'a.md')).toEqual(['a.md: needs at least one "## " heading']);
  });

  it('ships the Linux page in both languages with the same sections', () => {
    const headings = (lang: string) =>
      read(`src/games/linux/content/about.${lang}.md`)
        .match(/^#{2,3} /gm)
        ?.join('');
    for (const lang of ['en', 'fr']) {
      expect(checkAbout(read(`src/games/linux/content/about.${lang}.md`), lang)).toEqual([]);
    }
    expect(headings('fr')).toBe(headings('en'));
  });

  it('has capsule art for every playable game and the brand files', () => {
    for (const game of GAMES.filter((g) => g.status === 'play')) {
      expect(existsSync(join(process.cwd(), `public/games/${game.id}/cover/capsule-art.jpg`))).toBe(
        true,
      );
    }
    for (const file of ['xplore-labs-logo.svg', 'xplore-labs-mark.png']) {
      expect(existsSync(join(process.cwd(), 'public/brand', file))).toBe(true);
    }
  });
});
