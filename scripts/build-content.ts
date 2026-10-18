/**
 * Validates every mission file and writes the bundle the game imports.
 * Runs before dev, build, test and typecheck. Any error stops the build.
 *
 *   npm run content
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkCampaign, parseMission } from '../src/games/linux/content/load';
import type { LinuxContent, Mission } from '../src/games/linux/content/schema';

const contentDir = join(process.cwd(), 'src/games/linux/content');
const missionsDir = join(contentDir, 'missions');
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

if (errors.length) {
  console.error(`\nMission content has ${errors.length} problem(s):\n`);
  for (const error of errors) console.error(`  - ${error}`);
  console.error('\nFix the files in src/games/linux/content/missions and run npm run content.\n');
  process.exit(1);
}

missions.sort((a, b) => a.order - b.order);
const content: LinuxContent = { missions };
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'content.json'), `${JSON.stringify(content, null, 2)}\n`);
console.log(`Content OK: ${missions.length} missions checked and solved.`);
