/** Replaces `{{name}}` with the player's personal value. Unknown names are kept as-is. */
export function applySecrets(text: string, secrets: Record<string, string>): string {
  return text.replace(/\{\{\s*([\w-]+)\s*\}\}/g, (match, name: string) => secrets[name] ?? match);
}
