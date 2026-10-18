import { GAME_TITLE, GUIDE_NAME } from '../games/linux/meta';
import type { GameId } from './bridge/types';
import type { LocalizedText } from './i18n/text';

export interface GameEntry {
  id: GameId;
  title: LocalizedText;
  /** Subject tag on the card. */
  subject: LocalizedText;
  status: 'play' | 'soon';
  /** Route of the game (title screen), null while it is not playable. */
  href: string | null;
  guide: { name: string; kind: string };
  /** One or two sentences for the intro panel. */
  blurb: LocalizedText;
  /** Card accent colour. */
  accent: string;
}

/** The Labs hub cards (PRD section 8). Adding a game to the hub is one entry here. */
export const GAMES: GameEntry[] = [
  {
    id: 'linux',
    title: GAME_TITLE,
    subject: 'Linux',
    status: 'play',
    href: '/linux',
    guide: { name: GUIDE_NAME, kind: 'penguin' },
    blurb: {
      en: 'You wake up inside the FST server. Type real Linux commands to find the passwords and escape, zone by zone.',
      fr: 'Tu te réveilles dans le serveur de la FST. Tape de vraies commandes Linux pour trouver les mots de passe et t’échapper, zone par zone.',
    },
    accent: '#9ece6a',
  },
  {
    id: 'sql',
    title: { en: 'SQL game', fr: 'Jeu SQL' },
    subject: 'SQL',
    status: 'soon',
    href: null,
    guide: { name: '?', kind: 'dolphin' },
    blurb: {
      en: 'Query a real database in your browser, guided by a dolphin who hates a DELETE without WHERE.',
      fr: 'Interroge une vraie base de données dans ton navigateur, avec un dauphin qui déteste les DELETE sans WHERE.',
    },
    accent: '#7dcfff',
  },
  {
    id: 'git',
    title: { en: 'Git game', fr: 'Jeu Git' },
    subject: 'Git',
    status: 'soon',
    href: null,
    guide: { name: '?', kind: 'unknown' },
    blurb: {
      en: 'Branches, commits and merges, without the fear of breaking everything.',
      fr: 'Branches, commits et merges, sans la peur de tout casser.',
    },
    accent: '#f7768e',
  },
  {
    id: 'network',
    title: { en: 'Networking game', fr: 'Jeu Réseaux' },
    subject: { en: 'Networking', fr: 'Réseaux' },
    status: 'soon',
    href: null,
    guide: { name: '?', kind: 'unknown' },
    blurb: {
      en: 'Follow a packet across the internet and fix what blocks it.',
      fr: 'Suis un paquet à travers internet et répare ce qui le bloque.',
    },
    accent: '#e0af68',
  },
];
