import { labsDb } from '../src/labs/prisma';
import { seedFallbackData, seedLabsCatalog } from '../src/labs/seed';

async function main() {
  try {
    if (process.env.NODE_ENV === 'production') {
      await seedLabsCatalog();
      console.info('Labs games, levels and achievements are ready.');
    } else {
      await seedFallbackData();
      console.info('Local Labs players, games, levels, achievements and sample weekly XP are ready.');
    }
  } finally {
    await labsDb.$disconnect();
  }
}

void main().catch((error: unknown) => {
  console.error('Could not seed the local Labs database.', error);
  process.exitCode = 1;
});
