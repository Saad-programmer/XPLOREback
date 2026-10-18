/**
 * Validates every content file and writes the bundle the game imports.
 * Runs before dev, build, test and typecheck. Any error stops the build.
 *
 *   npm run content
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkCampaign, parseContentFile, parseMission } from '../src/games/linux/content/load';
import {
  memesSchema,
  reactionsSchema,
  type LinuxContent,
  type Meme,
  type Mission,
  type Reactions,
} from '../src/games/linux/content/schema';

const root = process.cwd();
const contentDir = join(root, 'src/games/linux/content');
const missionsDir = join(contentDir, 'missions');
const publicDir = join(root, 'public/games/linux');
const outDir = join(contentDir, 'generated');

const missions: Mission[] = [];
const errors: string[] = [];

for (const file of readdirSync(missionsDir)
  .filter((name) => /\.ya?ml$/.test(name))
  .sort()) {
  const result = parseMission(readFileSync(join(missionsDir, file), 'utf8'), file);
  if (result.ok) missions.push(result.mission);
  else errors.push(...result.errors);
}
errors.push(...checkCampaign(missions));

const reactionsFile = parseContentFile(
  readFileSync(join(contentDir, 'reactions.yaml'), 'utf8'),
  'reactions.yaml',
  reactionsSchema,
);
if (!reactionsFile.ok) errors.push(...reactionsFile.errors);

const memesFile = parseContentFile(
  readFileSync(join(publicDir, 'memes/memes.yaml'), 'utf8'),
  'memes.yaml',
  memesSchema,
);
if (!memesFile.ok) errors.push(...memesFile.errors);
else {
  for (const meme of memesFile.value) {
    for (const file of [meme.sound, meme.sticker]) {
      if (file && !existsSync(join(publicDir, file))) {
        errors.push(`memes.yaml: ${meme.event}: file public/games/linux/${file} does not exist`);
      }
    }
  }
}

if (errors.length || !reactionsFile.ok || !memesFile.ok) {
  console.error(`\nContent has ${errors.length} problem(s):\n`);
  for (const error of errors) console.error(`  - ${error}`);
  console.error(
    '\nFix the files in src/games/linux/content or public/games/linux, then run npm run content.\n',
  );
  process.exit(1);
}

missions.sort((a, b) => a.order - b.order);
const content: LinuxContent = {
  missions,
  reactions: reactionsFile.value as Reactions,
  memes: memesFile.value as Meme[],
};
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'content.json'), `${JSON.stringify(content, null, 2)}\n`);
console.log(
  `Content OK: ${missions.length} missions checked and solved, reactions and ${content.memes.length} memes checked.`,
);
