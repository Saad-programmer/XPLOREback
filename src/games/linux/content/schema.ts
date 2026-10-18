import { z } from 'zod';
import type { Goal } from '../engine/goals';
import type { FsEntrySpec } from '../engine/vfs/spec';
import { ZONE_IDS } from '../meta';

/** Placeholders a mission may use. The bridge gives one personal password per mission. */
export const SECRET_NAMES = ['password'] as const;

export const localizedText = z.union([
  z.string().min(1),
  z.object({ en: z.string().min(1), fr: z.string().min(1).optional() }).strict(),
]);

export const MOODS = [
  'neutral',
  'happy',
  'thinking',
  'shocked',
  'proud',
  'disappointed',
  'laughing',
  'sleeping',
] as const;
export const mood = z.enum(MOODS);

export const dialogueLine = z.object({ mood, text: localizedText }).strict();

/** YAML reads `mode: 600` as a number, so both forms are accepted. */
const mode = z
  .union([z.string(), z.number().int()])
  .transform(String)
  .pipe(z.string().regex(/^[0-7]{3,4}$/, 'must be octal permissions like 644 or 0600'));

const userName = z.string().regex(/^[a-z_][a-z0-9_-]*$/, 'must be a Linux user name');
const entryName = z
  .string()
  .regex(/^[^/]+$/, 'must not contain /')
  .refine((name) => name !== '.' && name !== '..', 'cannot be . or ..');
const absolutePath = z.string().regex(/^\//, 'must start with /');

const fileEntry = z
  .object({
    type: z.literal('file').optional(),
    content: z.string(),
    mode: mode.optional(),
    owner: userName.optional(),
    group: userName.optional(),
  })
  .strict();

export const fsEntry: z.ZodType<FsEntrySpec> = z.lazy(() =>
  z.union([
    z.string(),
    z
      .object({
        type: z.literal('dir'),
        mode: mode.optional(),
        owner: userName.optional(),
        group: userName.optional(),
        children: z.record(entryName, fsEntry).optional(),
      })
      .strict(),
    fileEntry,
  ]),
);

export const goal: z.ZodType<Goal> = z.lazy(() =>
  z.discriminatedUnion('type', [
    z.object({ type: z.literal('password'), value: z.string().min(1) }).strict(),
    z
      .object({
        type: z.literal('file_exists'),
        path: z.string().min(1),
        nodeType: z.enum(['file', 'dir']).optional(),
      })
      .strict(),
    z
      .object({
        type: z.literal('file_content'),
        path: z.string().min(1),
        equals: z.string().optional(),
        contains: z.string().optional(),
      })
      .strict()
      .refine((g) => g.equals !== undefined || g.contains !== undefined, {
        message: 'file_content needs equals or contains',
      }),
    z.object({ type: z.literal('cwd'), path: z.string().min(1) }).strict(),
    z
      .object({
        type: z.literal('permission'),
        path: z.string().min(1),
        mode: mode,
      })
      .strict(),
    z
      .object({
        type: z.literal('command_used'),
        name: z.string().min(1).optional(),
        minPipeLength: z.number().int().min(1).optional(),
      })
      .strict(),
    z.object({ type: z.literal('all'), goals: z.array(goal).min(2) }).strict(),
  ]),
);

export const missionSchema = z
  .object({
    /** Stable id, also the file name. Used in the database: never rename a published mission. */
    id: z
      .string()
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'must be kebab-case, e.g. archive-hidden-scroll'),
    game: z.literal('linux').default('linux'),
    zone: z.enum(ZONE_IDS),
    /** Position in the campaign (1 to 10, bonus cases after). */
    order: z.number().int().positive(),
    title: localizedText,
    /** The goal in one short line, shown in the top bar. */
    objective: localizedText,
    guide: z.literal('penguin').default('penguin'),
    user: userName.refine((name) => name !== 'root', 'the player is never root').default('intern'),
    briefing: z.array(dialogueLine).min(1),
    filesystem: z.record(absolutePath, z.record(entryName, fsEntry)),
    start_dir: z.string().default('~'),
    goal,
    /** From vague to precise. The last one can give the answer. */
    hints: z.array(localizedText).min(1),
    /** Mission-specific reactions. `on` is a command line, matched after trimming. */
    reactions: z
      .array(z.object({ on: z.string().min(1), mood, text: localizedText }).strict())
      .default([]),
    victory: z.array(dialogueLine).min(1),
    rewards: z
      .object({ points: z.number().int().min(0), no_hint_bonus: z.number().int().min(0) })
      .strict(),
    /** Shown after the victory: the concept learned, in one sentence. */
    concept: localizedText,
    /** Commands that solve the mission. Checked at build time, shown when the player gives up. */
    solution: z.array(z.string().min(1)).min(1),
  })
  .strict();

export type Mission = z.output<typeof missionSchema>;
export type Mood = z.output<typeof mood>;
export type DialogueLine = z.output<typeof dialogueLine>;

/** Classic mistakes the guide reacts to (content/reactions.yaml). */
export const REACTION_KEYS = [
  'rm_rf_root',
  'sudo',
  'sudo_spam',
  'sl',
  'vim_trap',
  'cd_into_file',
  'permission_denied',
  'exit',
  'error_streak',
  'idle',
] as const;
export type ReactionKey = (typeof REACTION_KEYS)[number];

const reaction = z
  .object({ lines: z.array(dialogueLine).min(1), lesson: dialogueLine.optional() })
  .strict();

export const reactionsSchema = z
  .object({
    reactions: z.object(Object.fromEntries(REACTION_KEYS.map((key) => [key, reaction]))).strict(),
    unknown_command: z.object({ lines: z.array(dialogueLine).min(1), tip: dialogueLine }).strict(),
  })
  .strict();

export type Reaction = z.output<typeof reaction>;
export interface Reactions {
  reactions: Record<ReactionKey, Reaction>;
  unknown_command: { lines: DialogueLine[]; tip: DialogueLine };
}

/** Meme events (PRD section 7). */
export const MEME_EVENTS = [
  'give_up',
  'rm_rf_root',
  'sudo_spam',
  'vim_trap',
  'mission_success_no_hint',
  'idle_60s',
] as const;
export type MemeEvent = (typeof MEME_EVENTS)[number];

const assetPath = z
  .string()
  .regex(/^[\w./-]+\.(wav|mp3|ogg|png|svg|webp|gif)$/, 'must be a file path like sounds/x.mp3');

export const memesSchema = z.array(
  z
    .object({
      event: z.enum(MEME_EVENTS),
      sound: assetPath.optional(),
      sticker: assetPath.optional(),
      chance: z.number().min(0).max(1).default(1),
    })
    .strict()
    .refine((meme) => meme.sound || meme.sticker, 'a meme needs a sound or a sticker'),
);
export type Meme = z.output<typeof memesSchema>[number];

export interface LinuxContent {
  /** Sorted by `order`. */
  missions: Mission[];
  reactions: Reactions;
  memes: Meme[];
}
