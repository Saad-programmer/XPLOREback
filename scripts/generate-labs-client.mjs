import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const prismaCli = require.resolve('prisma/build/index.js');
const result = spawnSync(
  process.execPath,
  [prismaCli, 'generate', '--schema', 'prisma/labs/schema.prisma'],
  {
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/xplore_labs',
      DIRECT_URL: process.env.DIRECT_URL || 'postgresql://postgres:postgres@localhost:5432/xplore_labs',
    },
    stdio: 'inherit',
  },
);

if (result.error) {
  throw result.error;
}

process.exitCode = result.status ?? 1;
