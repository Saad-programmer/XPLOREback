import type { DialogueLine, Meme, MemeEvent, ReactionKey, Reactions } from './content/schema';
import type { EventOf, SpecialKind } from './engine/events';

/** Screen effects (PRD section 8, "What happens while typing"). */
export type EffectKind = 'shake' | 'combo' | 'melt' | 'train' | 'vim' | 'confetti';

/** Files in public/games/linux/sounds/ (without .wav). */
export type SoundName =
  | 'ding'
  | 'bonk'
  | 'combo'
  | 'victory'
  | 'blip'
  | 'dramatic'
  | 'sad-violin'
  | 'applause'
  | 'giggle'
  | 'snore'
  | 'train'
  | 'door';

/** Small penguin animations on the live map (PRD section 6). */
export type PenguinAct = 'search' | 'panic' | 'dance' | 'sleep';

export interface Feedback {
  dialogue: DialogueLine[] | null;
  effects: EffectKind[];
  sounds: SoundName[];
  meme: MemeEvent | null;
  penguin: PenguinAct | null;
  /** The line counts as a mistake (for the "offer a hint" streak). */
  mistake: boolean;
}

export type Random = () => number;

export function pick<T>(items: readonly T[], random: Random): T {
  return items[Math.min(items.length - 1, Math.floor(random() * items.length))];
}

/** A random line of a reaction, followed by its lesson. */
export function reactionLines(
  reactions: Reactions,
  key: ReactionKey,
  random: Random,
): DialogueLine[] {
  const reaction = reactions.reactions[key];
  const line = pick(reaction.lines, random);
  return reaction.lesson ? [line, reaction.lesson] : [line];
}

/** Specials in priority order, with their effect and sound. */
const SPECIALS: [SpecialKind, Pick<Feedback, 'effects' | 'sounds' | 'meme'>][] = [
  ['rm_rf_root', { effects: ['melt'], sounds: [], meme: 'rm_rf_root' }],
  ['sudo_spam', { effects: ['shake'], sounds: ['bonk'], meme: 'sudo_spam' }],
  ['sudo', { effects: ['shake'], sounds: ['bonk'], meme: null }],
  ['vim_trap', { effects: ['vim'], sounds: [], meme: 'vim_trap' }],
  ['sl', { effects: ['train'], sounds: ['train'], meme: null }],
  ['cd_into_file', { effects: ['shake'], sounds: ['bonk'], meme: null }],
  ['exit', { effects: [], sounds: [], meme: null }],
];

/** What the game does after one terminal line. */
export function feedbackForLine(
  command: EventOf<'command'> | null,
  specials: readonly SpecialKind[],
  reactions: Reactions,
  random: Random,
): Feedback {
  const feedback: Feedback = {
    dialogue: null,
    effects: [],
    sounds: [],
    meme: null,
    penguin: null,
    mistake: false,
  };
  if (!command) return feedback;

  if (command.names.some((name) => name === 'grep' || name === 'find')) feedback.penguin = 'search';
  if (command.name === 'rm' && command.exitCode === 0) feedback.penguin = 'panic';

  const special = SPECIALS.find(([kind]) => specials.includes(kind));
  if (special) {
    const [kind, extra] = special;
    return {
      ...feedback,
      ...extra,
      dialogue: reactionLines(reactions, kind, random),
      penguin: kind === 'rm_rf_root' ? 'panic' : feedback.penguin,
      mistake: kind !== 'sl' && kind !== 'exit',
    };
  }

  if (command.errorKind === 'command_not_found') {
    const { lines, tip } = reactions.unknown_command;
    return {
      ...feedback,
      dialogue: [pick(lines, random), tip],
      effects: ['shake'],
      sounds: ['bonk'],
      mistake: true,
    };
  }
  if (command.errorKind === 'permission_denied') {
    return {
      ...feedback,
      dialogue: reactionLines(reactions, 'permission_denied', random),
      effects: ['shake'],
      sounds: ['door'],
      mistake: true,
    };
  }
  // grep without a match exits with 1 but is not an error: only real errors shake.
  if (command.errorKind)
    return { ...feedback, effects: ['shake'], sounds: ['bonk'], mistake: true };

  if (command.pipeLength >= 3 && command.exitCode === 0) {
    return { ...feedback, effects: ['combo'], sounds: ['combo'] };
  }
  return feedback;
}

/** The meme for an event, or null when there is none or the dice say no (memes stay rare). */
export function memeFor(event: MemeEvent, memes: readonly Meme[], random: Random): Meme | null {
  const options = memes.filter((meme) => meme.event === event);
  if (!options.length) return null;
  const meme = pick(options, random);
  return random() < meme.chance ? meme : null;
}
