import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getMission, memes, reactions } from '@/src/games/linux/content';
import type { EventOf } from '@/src/games/linux/engine/events';
import { createGameStore } from '@/src/games/linux/game-store';
import { feedbackForLine, memeFor } from '@/src/games/linux/reactions';
import { MockBridge } from '@/src/shared/bridge/mock-bridge';
import { createProgressStore } from '@/src/shared/progress/progress-store';
import { memoryStore } from '@/src/shared/storage';

const command = (overrides: Partial<EventOf<'command'>> = {}): EventOf<'command'> => ({
  type: 'command',
  raw: 'x',
  name: 'x',
  names: ['x'],
  args: [],
  exitCode: 0,
  pipeLength: 1,
  ...overrides,
});
const first = () => 0;

describe('feedbackForLine', () => {
  it('reacts to rm -rf / with the melt, a meme and a lesson', () => {
    const feedback = feedbackForLine(
      command({ name: 'rm', exitCode: 1 }),
      ['rm_rf_root'],
      reactions,
      first,
    );
    expect(feedback).toMatchObject({
      effects: ['melt'],
      meme: 'rm_rf_root',
      penguin: 'panic',
      mistake: true,
    });
    expect(feedback.dialogue).toHaveLength(2);
    expect(feedback.dialogue?.[1]).toBe(reactions.reactions.rm_rf_root.lesson);
  });

  it('prefers sudo spam over sudo', () => {
    expect(feedbackForLine(command(), ['sudo', 'sudo_spam'], reactions, first).meme).toBe(
      'sudo_spam',
    );
  });

  it('gives a funny line and a tip for unknown commands', () => {
    const feedback = feedbackForLine(
      command({ errorKind: 'command_not_found', exitCode: 127 }),
      [],
      reactions,
      first,
    );
    expect(feedback.dialogue).toEqual([
      reactions.unknown_command.lines[0],
      reactions.unknown_command.tip,
    ]);
    expect(feedback.sounds).toEqual(['bonk']);
  });

  it('plays the door for permission denied, shakes on other errors only', () => {
    expect(
      feedbackForLine(
        command({ errorKind: 'permission_denied', exitCode: 1 }),
        [],
        reactions,
        first,
      ).sounds,
    ).toEqual(['door']);
    expect(
      feedbackForLine(command({ errorKind: 'not_found', exitCode: 1 }), [], reactions, first)
        .effects,
    ).toEqual(['shake']);
    // grep without a match is not an error.
    expect(
      feedbackForLine(
        command({ name: 'grep', names: ['grep'], exitCode: 1 }),
        [],
        reactions,
        first,
      ),
    ).toMatchObject({
      effects: [],
      penguin: 'search',
      mistake: false,
    });
  });

  it('celebrates pipe chains of 3 or more', () => {
    expect(feedbackForLine(command({ pipeLength: 3 }), [], reactions, first)).toMatchObject({
      effects: ['combo'],
      sounds: ['combo'],
    });
    expect(feedbackForLine(command({ pipeLength: 2 }), [], reactions, first).effects).toEqual([]);
  });
});

describe('memeFor', () => {
  it('respects the chance so memes stay rare', () => {
    expect(memeFor('give_up', memes, () => 0.1)).not.toBeNull();
    expect(memeFor('give_up', memes, () => 0.9)).toBeNull();
    expect(memeFor('rm_rf_root', memes, () => 0.99)?.sticker).toBe('memes/on-fire.svg');
  });
});

describe('fun layer in a mission', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  async function play(missionId = 'archive-hidden-scroll') {
    const store = memoryStore();
    const progress = createProgressStore({ bridge: new MockBridge(store), store });
    const sounds: string[] = [];
    const game = createGameStore({
      mission: getMission(missionId)!,
      progress,
      reactions,
      memes,
      sound: { play: (name) => sounds.push(name) },
      random: () => 0,
      idleMs: 60_000,
    });
    await game.getState().start();
    return { state: () => game.getState(), sounds };
  }

  it('sudo three times: refusal, sound, then the sudo spam meme', async () => {
    const { state, sounds } = await play();
    state().run('sudo ls');
    expect(state().dialogue?.lines[0]).toBe(reactions.reactions.sudo.lines[0]);
    state().run('sudo ls');
    state().run('sudo cat x');
    expect(state().meme).toMatchObject({ sticker: 'memes/facepalm.svg' });
    expect(sounds.filter((s) => s === 'bonk')).toHaveLength(3);
  });

  it('vim traps the terminal until :q!', async () => {
    const { state, sounds } = await play();
    state().run('vim notes.txt');
    expect(state().vimOpen).toBe(true);
    expect(sounds).toContain('sounds/sad-violin.wav');
    expect(state().run('ls')).toBeNull();
    expect(state().vimCommand(':exit')).toBe(false);
    expect(state().vimCommand(':q!')).toBe(true);
    expect(state().vimOpen).toBe(false);
    expect(state().run('ls')).not.toBeNull();
  });

  it('offers a hint after 3 mistakes in a row', async () => {
    const { state } = await play();
    state().nextLine();
    state().run('cat nope');
    state().run('cd nowhere');
    expect(state().dialogue?.kind).toBe('briefing');
    state().run('cat ghost');
    expect(state().dialogue?.lines[0]).toBe(reactions.reactions.error_streak.lines[0]);
  });

  it('gives the full answer after the last hint, with the give up meme', async () => {
    const { state } = await play();
    for (let i = 0; i < 3; i++) state().showHint();
    expect(state().answerShown).toBe(false);
    state().showHint();
    expect(state().answerShown).toBe(true);
    expect(state().dialogue?.lines[1].text).toBe('ls\nls -a\ncat .secret_scroll');
    expect(state().meme).toMatchObject({ sticker: 'memes/lol.svg' });
  });

  it('falls asleep after 60 s without typing and wakes up on a key', async () => {
    const { state } = await play();
    await vi.advanceTimersByTimeAsync(59_000);
    state().noteActivity();
    await vi.advanceTimersByTimeAsync(59_000);
    expect(state().penguin).toBeNull();
    await vi.advanceTimersByTimeAsync(1_000);
    expect(state().penguin?.act).toBe('sleep');
    expect(state().dialogue?.lines[0].mood).toBe('sleeping');
    state().noteActivity();
    expect(state().penguin).toBeNull();
  });

  it('wins with confetti, the victory sound, a dance and the no-hint meme', async () => {
    const { state, sounds } = await play();
    const password = state().run('cat .secret_scroll')!.stdout.trim();
    await state().submitPassword(password);
    expect(state().effects.map((e) => e.kind)).toContain('confetti');
    expect(state().penguin?.act).toBe('dance');
    expect(sounds).toEqual(expect.arrayContaining(['victory', 'sounds/applause.wav']));
  });

  it('shakes and bonks on a wrong password', async () => {
    const { state, sounds } = await play();
    await state().submitPassword('nope');
    expect(state().effects.map((e) => e.kind)).toEqual(['shake']);
    expect(sounds).toEqual(['bonk']);
  });
});
