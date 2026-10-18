export type Lang = 'en' | 'fr';

/** A plain string is used for both languages. English is the fallback. */
export type LocalizedText = string | { en: string; fr?: string };

export function pickText(text: LocalizedText, lang: Lang): string {
  if (typeof text === 'string') return text;
  return (lang === 'fr' && text.fr) || text.en;
}
