import type { LocalizedText } from '@/src/shared/i18n/text';

/** Interface text of the Linux game screen. Mission text lives in the mission files. */
export const UI = {
  welcomeBack: {
    en: 'Welcome back! Everything you did is still here.',
    fr: 'Re-bonjour ! Tout ce que tu as fait est encore là.',
  },
  noMoreHints: {
    en: 'That was my last hint. The answer is in the hint above!',
    fr: 'C’était mon dernier indice. La réponse est dans l’indice du dessus !',
  },
  wrongPassword: {
    en: 'Nope, that is not the password. Read it again, carefully.',
    fr: 'Non, ce n’est pas le mot de passe. Relis-le bien.',
  },
  loading: { en: 'Booting the server…', fr: 'Démarrage du serveur…' },
  loadError: {
    en: 'The mission could not start. Check your connection and reload the page.',
    fr: 'La mission n’a pas pu démarrer. Vérifie ta connexion et recharge la page.',
  },
  backToXplore: { en: 'Back to Xplore', fr: 'Retour à Xplore' },
  goal: { en: 'Goal', fr: 'Objectif' },
  points: { en: 'points', fr: 'points' },
  hint: { en: 'Hint', fr: 'Indice' },
  restart: { en: 'Restart', fr: 'Recommencer' },
  restartConfirm: {
    en: 'Start this mission again from the beginning?',
    fr: 'Recommencer cette mission depuis le début ?',
  },
  soundOn: { en: 'Sound on', fr: 'Son activé' },
  soundOff: { en: 'Sound off', fr: 'Son coupé' },
  maximize: { en: 'Maximize', fr: 'Agrandir' },
  restore: { en: 'Restore size', fr: 'Taille normale' },
  fullscreen: { en: 'Full screen', fr: 'Plein écran' },
  passwordLabel: { en: 'Password', fr: 'Mot de passe' },
  passwordSubmit: { en: 'Unlock', fr: 'Déverrouiller' },
  terminal: { en: 'Terminal', fr: 'Terminal' },
  terminalWelcome: {
    en: 'FST server, Linux 6.1. Type help to see the commands you can use.',
    fr: 'Serveur FST, Linux 6.1. Tape help pour voir les commandes disponibles.',
  },
  map: { en: 'Map', fr: 'Carte' },
  mapYouAreHere: { en: 'You are here', fr: 'Tu es ici' },
  mapUnexplored: { en: 'not listed yet', fr: 'pas encore listé' },
  next: { en: 'Next', fr: 'Suivant' },
  minimize: { en: 'Hide dialogue', fr: 'Masquer le dialogue' },
  expand: { en: 'Show dialogue', fr: 'Afficher le dialogue' },
  victoryTitle: { en: 'Mission complete', fr: 'Mission réussie' },
  learned: { en: 'What you learned', fr: 'Ce que tu as appris' },
  pointsEarned: { en: 'points earned', fr: 'points gagnés' },
  alreadyDone: {
    en: 'Already completed before: no new points, but nice practice.',
    fr: 'Déjà réussie avant : pas de nouveaux points, mais bon entraînement.',
  },
  savedOffline: {
    en: 'Saved on this device. Points will be added when you are back online.',
    fr: 'Enregistré sur cet appareil. Les points seront ajoutés dès que tu seras en ligne.',
  },
  nextMission: { en: 'Next mission', fr: 'Mission suivante' },
  replay: { en: 'Play again', fr: 'Rejouer' },
  campaignDone: {
    en: 'You finished every mission available for now. More are coming!',
    fr: 'Tu as fini toutes les missions disponibles pour l’instant. D’autres arrivent !',
  },
} satisfies Record<string, LocalizedText>;
