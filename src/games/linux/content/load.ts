import { load } from 'js-yaml';
import { z } from 'zod';
import { goalWithSecrets, isGoalMet, passwordsOf } from '../engine/goals';
import { createShell } from '../engine/shell';
import { missionSchema, SECRET_NAMES, type Mission } from './schema';

export type LoadResult = { ok: true; mission: Mission } | { ok: false; errors: string[] };

/** Fake secret used to check that every mission can be solved. */
export const CHECK_SECRETS = { password: 'test-PENGU-00' };

function formatIssue(issue: z.core.$ZodIssue): string {
  const path = issue.path.length ? issue.path.join('.') : '(file)';
  return `${path}: ${issue.message}`;
}

/** Parses and validates one mission file. Errors name the file and the field. */
export function parseMission(text: string, fileName: string): LoadResult {
  let data: unknown;
  try {
    data = load(text, { filename: fileName });
  } catch (error) {
    return { ok: false, errors: [`${fileName}: invalid YAML: ${(error as Error).message}`] };
  }
  const parsed = missionSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.issues.map((i) => `${fileName}: ${formatIssue(i)}`) };
  }
  const mission = parsed.data;
  const errors = checkMission(mission).map((message) => `${fileName}: ${message}`);
  const expectedId = fileName.replace(/^.*[\\/]/, '').replace(/\.ya?ml$/, '');
  if (mission.id !== expectedId) {
    errors.unshift(`${fileName}: id "${mission.id}" must match the file name "${expectedId}"`);
  }
  return errors.length ? { ok: false, errors } : { ok: true, mission };
}

/** Every `{{name}}` must be a known secret. */
function unknownPlaceholders(mission: Mission): string[] {
  const names = new Set<string>();
  const json = JSON.stringify(mission);
  for (const match of json.matchAll(/\{\{\s*([\w-]+)\s*\}\}/g)) names.add(match[1]);
  return [...names].filter((name) => !(SECRET_NAMES as readonly string[]).includes(name));
}

/**
 * Plays the mission: the start folder must exist, the goal must not be reached
 * at the start, and the solution must reach it.
 */
export function checkMission(mission: Mission): string[] {
  const errors = unknownPlaceholders(mission).map(
    (name) => `unknown placeholder {{${name}}} (allowed: ${SECRET_NAMES.join(', ')})`,
  );

  let shell;
  try {
    shell = createShell({
      filesystem: mission.filesystem,
      startDir: mission.start_dir,
      user: mission.user,
      goal: mission.goal,
      missionId: mission.id,
      secrets: CHECK_SECRETS,
    });
  } catch (error) {
    return [...errors, `filesystem: ${(error as Error).message}`];
  }
  if (shell.vfs.stat(shell.cwd())?.type !== 'dir') {
    errors.push(`start_dir: "${mission.start_dir}" is not a folder of the filesystem`);
    return errors;
  }

  const startContext = {
    vfs: shell.vfs,
    cwd: shell.cwd(),
    home: shell.user.home,
    answer: null,
    lastLine: null,
  };
  if (isGoalMet(goalWithSecrets(mission.goal, CHECK_SECRETS), startContext)) {
    errors.push('goal: already reached before the player does anything');
  }

  let output = '';
  for (const line of mission.solution) {
    const result = shell.run(line);
    output += result.stdout;
    if (result.stderr && !result.goalReached) {
      errors.push(`solution: "${line}" printed an error: ${result.stderr.trim()}`);
    }
  }
  // The player can only type a password they have seen on screen.
  for (const password of passwordsOf(goalWithSecrets(mission.goal, CHECK_SECRETS))) {
    if (output.includes(password)) shell.submitAnswer(password);
  }
  if (!shell.isGoalReached()) errors.push('solution: does not reach the goal');
  return errors;
}

/** Checks rules that need all missions at once. */
export function checkCampaign(missions: Mission[]): string[] {
  const errors: string[] = [];
  const seen = new Map<string, string>();
  for (const mission of missions) {
    const orderKey = `order ${mission.order}`;
    if (seen.has(mission.id)) errors.push(`duplicate id "${mission.id}"`);
    if (seen.has(orderKey))
      errors.push(`missions "${seen.get(orderKey)}" and "${mission.id}" share ${orderKey}`);
    seen.set(mission.id, mission.id);
    seen.set(orderKey, mission.id);
  }
  return errors;
}
