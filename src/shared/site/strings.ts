import type { LocalizedText } from '../i18n/text';

/** Interface text of the website pages: navbar, game details page. */
export const SITE = {
  home: { en: 'Xplore Labs home', fr: 'Accueil Xplore Labs' },
  games: { en: 'Games', fr: 'Jeux' },
  missions: { en: 'Missions', fr: 'Missions' },
  menu: { en: 'Menu', fr: 'Menu' },
  openMenu: { en: 'Open the menu', fr: 'Ouvrir le menu' },
  profile: { en: 'Profile and settings', fr: 'Profil et réglages' },
  level: { en: 'Level', fr: 'Niveau' },
  points: { en: 'points', fr: 'points' },
  nextLevel: { en: 'to the next level', fr: 'avant le niveau suivant' },
  settings: { en: 'Settings', fr: 'Réglages' },
  sound: { en: 'Sound', fr: 'Son' },
  memeSounds: { en: 'Meme sounds', fr: 'Sons des memes' },
  reducedMotion: { en: 'Reduced motion', fr: 'Animations réduites' },
  language: { en: 'Language', fr: 'Langue' },
  switchLanguage: { en: 'Passer en français', fr: 'Switch to English' },
  backToXplore: { en: 'Back to Xplore', fr: 'Retour à Xplore' },
  guest: { en: 'Loading…', fr: 'Chargement…' },
  footerTagline: {
    en: 'Xplore Labs: the teaching games of Xplore, the ILISI student club.',
    fr: 'Xplore Labs : les jeux pour apprendre du club Xplore, le club étudiant de la filière ILISI.',
  },
  foundedBy: { en: 'Founded by', fr: 'Fondé par' },
  developedBy: { en: 'Developed by', fr: 'Développé par' },
  githubProfile: { en: 'GitHub profile of', fr: 'Profil GitHub de' },
  feedback: { en: 'Your feedback', fr: 'Votre avis' },
  backToTop: { en: 'Back to top', fr: 'Retour en haut' },
} satisfies Record<string, LocalizedText>;

/** Points per level of the navbar XP bar (display only: points come from the server). */
export const POINTS_PER_LEVEL = 100;

export function levelOf(points: number) {
  return {
    level: Math.floor(points / POINTS_PER_LEVEL) + 1,
    /** 0 to 100: progress inside the current level. */
    percent: ((points % POINTS_PER_LEVEL) / POINTS_PER_LEVEL) * 100,
    toNext: POINTS_PER_LEVEL - (points % POINTS_PER_LEVEL),
  };
}

/** Text of the game details page. */
export const DETAILS = {
  allGames: { en: 'All games', fr: 'Tous les jeux' },
  playNow: { en: 'Play now', fr: 'Jouer maintenant' },
  continue: { en: 'Continue', fr: 'Continuer' },
  comingSoon: { en: 'Coming soon', fr: 'Bientôt' },
  moreInfo: { en: 'More info', fr: 'Plus d’infos' },
  lessInfo: { en: 'Less info', fr: 'Moins d’infos' },
  missions: { en: 'missions', fr: 'missions' },
  guide: { en: 'Guide', fr: 'Guide' },
  inBrowser: { en: 'Runs in the browser', fr: 'Dans le navigateur' },
  progress: { en: 'Your progress', fr: 'Ta progression' },
  done: { en: 'done', fr: 'réussies' },
  missionMap: { en: 'Mission map', fr: 'Carte des missions' },
  notYet: {
    en: 'This game is not ready yet. The club is working on it.',
    fr: 'Ce jeu n’est pas encore prêt. Le club y travaille.',
  },
  aboutTitle: { en: 'About the game', fr: 'À propos du jeu' },
} satisfies Record<string, LocalizedText>;
