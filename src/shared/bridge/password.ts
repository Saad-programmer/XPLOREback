const ALPHABET = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const WORDS = [
  'PENGU',
  'ROOT',
  'SHELL',
  'PIPE',
  'GREP',
  'KERNEL',
  'BASH',
  'CRON',
  'STACK',
  'BYTE',
  'CACHE',
  'DAEMON',
  'PROMPT',
  'SOCKET',
  'INODE',
  'PATCH',
];

const encoder = new TextEncoder();

/**
 * Personal mission password: HMAC-SHA256(secret, `${userId}:${missionId}`),
 * shown as `xxxx-WORD-00` so it is easy to read and type. Sharing it does not
 * work for another player. The NestJS labs module must use the same formula.
 */
export async function personalPassword(
  secret: string,
  userId: string,
  missionId: string,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = new Uint8Array(
    await crypto.subtle.sign('HMAC', key, encoder.encode(`${userId}:${missionId}`)),
  );
  const head = Array.from(signature.slice(0, 4), (byte) => ALPHABET[byte % ALPHABET.length]).join(
    '',
  );
  const word = WORDS[signature[4] % WORDS.length];
  const number = String(signature[5] % 100).padStart(2, '0');
  return `${head}-${word}-${number}`;
}
