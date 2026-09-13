import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  output: 'standalone',
  distDir: process.env.NEXT_DIST_DIR ?? '.next',
  outputFileTracingRoot: path.join(process.cwd(), '..'),
};

export default nextConfig;
