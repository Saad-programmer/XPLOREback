import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier/flat';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    // Generated Prisma client:
    'src/generated/labs-client/**',
    // Installed Claude Code skills (third-party examples, not our code).
    '.claude/**',
    // Static third-party game assets:
    'public/games/**',
    'src/games/SQLGame/**',
    'src/games/nextHop/**',
  ]),
]);

export default eslintConfig;
