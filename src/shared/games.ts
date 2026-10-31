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
  /** Mission map of the game, if it has one. */
  mapHref?: string;
  guide: { name: string; kind: string };
  /** One or two sentences for the details page. */
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
    mapHref: '/linux/missions',
    guide: { name: GUIDE_NAME, kind: 'penguin' },
    blurb: {
      en: 'You wake up inside the FST server. Type real Linux commands to find the passwords and escape, zone by zone.',
      fr: 'Tu te réveilles dans le serveur de la FST. Tape de vraies commandes Linux pour trouver les mots de passe et t’échapper, zone par zone.',
    },
    accent: '#9ece6a',
  },
  {
    id: 'sql',
    title: { en: 'SQLGame', fr: 'SQLGame' },
    subject: 'SQL',
    status: 'play',
    href: '/sql',
    guide: { name: '?', kind: 'dolphin' },
    blurb: {
      en: 'A detective game. A war game. Both played with SQL.',
      fr: 'Un jeu d’enquête. Un jeu de guerre. Les deux se jouent en SQL.',
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
    title: { en: 'Next-Hop-Networking', fr: 'Next-Hop-Networking' },
    subject: { en: 'Networking', fr: 'Réseaux' },
    status: 'play',
    href: '/nextHop',
    guide: { name: '?', kind: 'unknown' },
    blurb: {
      en: 'A retro-cyberpunk flappy puzzle game where you are the packet, and the network is trying to drop you.',
      fr: 'Un jeu de puzzle rétro-cyberpunk où tu incarnes un paquet et où le réseau tente de te faire tomber.',
    },
    accent: '#e0af68',
  },
];
