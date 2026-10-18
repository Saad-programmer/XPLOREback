import type { LocalizedText } from '@/src/shared/i18n/text';

/** Working title (PRD section 1). Change it here only. */
export const GAME_TITLE = 'Root Escape';
/** Placeholder until the club picks the penguin's name (PRD section 6). */
export const GUIDE_NAME = 'Pixel';

export const ZONE_IDS = [
  'wake-up-room',
  'archive',
  'search-hall',
  'pipe-factory',
  'guarded-vault',
  'detective',
] as const;

export type ZoneId = (typeof ZONE_IDS)[number];

export interface Zone {
  id: ZoneId;
  title: LocalizedText;
  /** Accent color of the zone (PRD section 8). */
  color: string;
}

export const ZONES: Zone[] = [
  {
    id: 'wake-up-room',
    title: { en: 'The wake-up room', fr: 'La salle du réveil' },
    color: '#7aa2f7',
  },
  { id: 'archive', title: { en: 'The archive', fr: 'Les archives' }, color: '#9ece6a' },
  {
    id: 'search-hall',
    title: { en: 'The search hall', fr: 'Le hall de recherche' },
    color: '#e0af68',
  },
  {
    id: 'pipe-factory',
    title: { en: 'The pipe factory', fr: 'L’usine à pipes' },
    color: '#bb9af7',
  },
  {
    id: 'guarded-vault',
    title: { en: 'The guarded vault', fr: 'Le coffre gardé' },
    color: '#f7768e',
  },
  { id: 'detective', title: { en: 'Detective cases', fr: 'Enquêtes' }, color: '#7dcfff' },
];
