import type { NextConfig } from 'next';
import { BASE_PATH } from './src/shared/asset';

const nextConfig: NextConfig = {
  // Served at /labs on the Xplore domain (Multi-Zones, PRD section 12).
  basePath: BASE_PATH,
  cacheComponents: true,
  // No "N" badge in the corner during development (errors still show when they happen).
  devIndicators: false,
  partialPrefetching: true,
  redirects() {
    return [
      // Running the app alone (npm run dev): open http://localhost:3000 and land on /labs.
      // On the Xplore domain the root belongs to Xplore, so this is never reached there.
      { source: '/', destination: BASE_PATH, basePath: false, permanent: false },
    ];
  },
};

export default nextConfig;
