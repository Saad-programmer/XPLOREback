import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { checkAbout } from '@/src/games/linux/content/load';
import { GAMES } from '@/src/shared/games';
import { generateStarfield, STAR_TILE, starPosition, twinkle } from '@/src/shared/site/stars';
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

describe('website starfield', () => {
  const stars = generateStarfield();

  it('is the same on every visit (seeded)', () => {
    expect(generateStarfield()).toEqual(stars);
    expect(generateStarfield(1)).not.toEqual(stars);
  });

  it('has far, many stars and near, few pixel sparkles', () => {
    const far = stars.filter((s) => s.depth < 0.5);
    const near = stars.filter((s) => s.depth > 0.5);
    expect(far.length).toBeGreaterThan(near.length * 5);
    expect(far.every((s) => !s.sparkle)).toBe(true);
    expect(near.some((s) => s.sparkle)).toBe(true);
  });

  it('keeps every star inside the tile while it drifts and scrolls', () => {
    for (const [time, scroll] of [
      [0, 0],
      [3600, 0],
      [12.5, 4000],
      [0, -300],
    ]) {
      for (const star of stars) {
        const { x, y } = starPosition(star, time, scroll);
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThan(STAR_TILE);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThan(STAR_TILE);
      }
    }
  });

  it('moves near stars faster than far ones (parallax)', () => {
    const far = stars.find((s) => s.depth < 0.2)!;
    const near = stars.find((s) => s.depth > 0.5)!;
    const moved = (s: typeof far) => {
      const a = starPosition({ ...s, x: 450, y: 450 }, 0, 0);
      const b = starPosition({ ...s, x: 450, y: 450 }, 10, 0);
      return Math.hypot(b.x - a.x, b.y - a.y);
    };
    expect(moved(near)).toBeGreaterThan(moved(far) * 3);
  });

  it('twinkles between 55% and 100% of a star brightness', () => {
    for (const star of stars.slice(0, 20)) {
      for (const t of [0, 1.3, 7, 99]) {
        const value = twinkle(star, t);
        expect(value).toBeGreaterThanOrEqual(star.alpha * 0.55 - 1e-9);
        expect(value).toBeLessThanOrEqual(star.alpha + 1e-9);
      }
    }
  });
});
