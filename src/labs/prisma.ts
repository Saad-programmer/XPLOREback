import { PrismaClient } from '../generated/labs-client';

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error('DATABASE_URL is required for the Labs gamification database.');
}

export const labsDb = new PrismaClient({
  datasources: { db: { url } },
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});
