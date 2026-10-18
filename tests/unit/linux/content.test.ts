import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { checkCampaign, parseMission } from '@/src/games/linux/content/load';
import type { Mission } from '@/src/games/linux/content/schema';

const MISSIONS_DIR = join(process.cwd(), 'src/games/linux/content/missions');

const VALID = `
id: test-mission
zone: archive
order: 42
title: Test
briefing:
  - { mood: neutral, text: "Hello" }
filesystem:
  /home/intern:
    secret.txt: { content: "{{password}}", mode: 600 }
goal: { type: password, value: "{{password}}" }
hints: ["Read the file"]
victory:
  - { mood: happy, text: "Done" }
rewards: { points: 10, no_hint_bonus: 5 }
concept: "cat reads files"
solution: ["cat secret.txt"]
`;

function errorsOf(yaml: string, file = 'test-mission.yaml'): string[] {
  const result = parseMission(yaml, file);
  return result.ok ? [] : result.errors;
}

describe('mission files in the repo', () => {
  const files = readdirSync(MISSIONS_DIR).filter((name) => name.endsWith('.yaml'));

  it('includes missions 1 to 3', () => {
    expect(files).toEqual(
      expect.arrayContaining([
        'wake-up-hello-world.yaml',
        'wake-up-first-door.yaml',
        'archive-hidden-scroll.yaml',
      ]),
    );
  });

  it.each(files)('%s is valid and solvable', (file) => {
    expect(errorsOf(readFileSync(join(MISSIONS_DIR, file), 'utf8'), file)).toEqual([]);
  });

  it('every text has a French version', () => {
    for (const file of files) {
      const result = parseMission(readFileSync(join(MISSIONS_DIR, file), 'utf8'), file);
      if (!result.ok) throw new Error(result.errors.join('\n'));
      const { title, briefing, hints, victory, concept } = result.mission;
      const texts = [
        title,
        concept,
        ...hints,
        ...briefing.map((l) => l.text),
        ...victory.map((l) => l.text),
      ];
      for (const text of texts)
        expect(
          typeof text === 'object' && text.fr,
          `${file}: ${JSON.stringify(text)}`,
        ).toBeTruthy();
    }
  });
});

describe('parseMission', () => {
  it('accepts a valid mission and fills defaults', () => {
    const result = parseMission(VALID, 'test-mission.yaml');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.mission).toMatchObject({
      game: 'linux',
      guide: 'penguin',
      user: 'intern',
      start_dir: '~',
      reactions: [],
    });
    // YAML reads 600 as a number: it becomes the string "600".
    expect(result.mission.filesystem['/home/intern']['secret.txt']).toMatchObject({ mode: '600' });
  });

  it('reports broken YAML', () => {
    expect(errorsOf('id: [oops')[0]).toMatch(/^test-mission\.yaml: invalid YAML/);
  });

  it('names the file and the field', () => {
    expect(errorsOf(VALID.replace('zone: archive', 'zone: kitchen'))).toEqual([
      expect.stringMatching(/^test-mission\.yaml: zone: /),
    ]);
    expect(errorsOf(VALID.replace('hints: ["Read the file"]', 'hints: []'))[0]).toContain('hints');
    expect(errorsOf(VALID.replace('mode: 600', 'mode: 999'))[0]).toContain('octal');
    expect(errorsOf(`${VALID}\ncolor: red`)[0]).toContain('color');
  });

  it('refuses root and bad ids', () => {
    expect(errorsOf(`${VALID}\nuser: root`)[0]).toContain('never root');
    expect(errorsOf(VALID.replace('id: test-mission', 'id: Test_Mission'))[0]).toContain(
      'kebab-case',
    );
  });

  it('checks that the id matches the file name', () => {
    expect(errorsOf(VALID, 'other-name.yaml')[0]).toContain('must match the file name');
  });

  it('refuses unknown placeholders', () => {
    expect(errorsOf(VALID.replace('content: "{{password}}"', 'content: "{{pin}}"'))).toContain(
      'test-mission.yaml: unknown placeholder {{pin}} (allowed: password)',
    );
  });

  it('refuses a start folder that does not exist', () => {
    expect(errorsOf(`${VALID}\nstart_dir: /nowhere`)[0]).toContain('start_dir');
  });

  it('refuses a solution that does not work', () => {
    const errors = errorsOf(
      VALID.replace('solution: ["cat secret.txt"]', 'solution: ["cat nope.txt"]'),
    );
    expect(errors).toContain(
      'test-mission.yaml: solution: "cat nope.txt" printed an error: cat: nope.txt: No such file or directory',
    );
    expect(errors).toContain('test-mission.yaml: solution: does not reach the goal');
  });

  it('refuses a goal reached before the player does anything', () => {
    const yaml = VALID.replace(
      'goal: { type: password, value: "{{password}}" }',
      'goal: { type: cwd, path: "~" }',
    );
    expect(errorsOf(yaml)).toContain(
      'test-mission.yaml: goal: already reached before the player does anything',
    );
  });
});

describe('checkCampaign', () => {
  it('refuses duplicate ids and orders', () => {
    const base = { id: 'a', order: 1 } as Mission;
    expect(checkCampaign([base, { ...base, id: 'b' }, { ...base, order: 2 }])).toEqual([
      'missions "a" and "b" share order 1',
      'duplicate id "a"',
    ]);
  });
});
