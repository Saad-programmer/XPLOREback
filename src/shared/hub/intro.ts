import { asset } from '../asset';

const SEEN_KEY = 'labs:intro-seen';

/** The intro plays on the first visit only, remembered on this device (PRD section 8). */
export function introSeen(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return true; // storage blocked: do not force the video on every visit
  }
}

export function markIntroSeen(): void {
  try {
    localStorage.setItem(SEEN_KEY, '1');
  } catch {
    // Nothing to do.
  }
}

/** The one intro video (with sound). */
export const INTRO_VIDEO = asset('intro/XploreLabs_Intro_16x9_sound.mp4');
