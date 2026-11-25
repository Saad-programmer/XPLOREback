import { createHmac } from 'node:crypto';

const alphabet = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const words = [
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

export function missionPassword(secret: string, userId: string, missionId: string): string {
  const digest = createHmac('sha256', secret).update(`${userId}:${missionId}`).digest();
  const head = Array.from(digest.subarray(0, 4), (byte) => alphabet[byte % alphabet.length]).join(
    '',
  );
  return `${head}-${words[digest[4] % words.length]}-${String(digest[5] % 100).padStart(2, '0')}`;
}
