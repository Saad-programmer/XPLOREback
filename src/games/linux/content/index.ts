import generated from './generated/content.json';
import type { LinuxContent, Mission } from './schema';

/** Already validated by `npm run content` (scripts/build-content.ts). */
const content = generated as unknown as LinuxContent;

export const missions: readonly Mission[] = content.missions;
export const reactions = content.reactions;
export const memes = content.memes;
export const about = content.about;

export function getMission(id: string): Mission | undefined {
  return missions.find((mission) => mission.id === id);
}

export function nextMission(id: string): Mission | undefined {
  const index = missions.findIndex((mission) => mission.id === id);
  return index >= 0 ? missions[index + 1] : undefined;
}

export type { Mission } from './schema';
