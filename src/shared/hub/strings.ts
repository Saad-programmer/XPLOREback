import type { LocalizedText } from '../i18n/text';

/** Interface text of the Labs hub and the intro video. */
export const HUB = {
  title: 'Xplore Labs',
  tagline: {
    en: 'Learn real technical skills by playing. Your progress is saved to your Xplore account.',
    fr: 'Apprends de vraies compétences techniques en jouant. Ta progression est enregistrée sur ton compte Xplore.',
  },
  playNow: { en: 'Play now', fr: 'Jouer' },
  comingSoon: { en: 'Coming soon', fr: 'Bientôt' },
  close: { en: 'Close', fr: 'Fermer' },
  yourGame: { en: 'Your game here', fr: 'Ton jeu ici' },
  yourGameText: {
    en: 'Have an idea for a teaching game? Games, missions and memes are simple files: talk to the Xplore team and build it with us.',
    fr: 'Une idée de jeu pour apprendre ? Les jeux, missions et memes sont de simples fichiers : parles-en à l’équipe Xplore et construis-le avec nous.',
  },
  propose: { en: 'Propose a game', fr: 'Proposer un jeu' },
  replayIntro: { en: 'Replay intro', fr: 'Revoir l’intro' },
  skip: { en: 'Skip', fr: 'Passer' },
  introLabel: { en: 'Xplore Labs intro', fr: 'Intro Xplore Labs' },
} satisfies Record<string, LocalizedText>;
