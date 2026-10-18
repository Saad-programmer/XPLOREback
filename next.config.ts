import type { NextConfig } from 'next';
import { BASE_PATH } from './src/shared/asset';

const nextConfig: NextConfig = {
  // Served at /labs on the Xplore domain (Multi-Zones, PRD section 12).
  basePath: BASE_PATH,
  cacheComponents: true,
  partialPrefetching: true,
};

export default nextConfig;
