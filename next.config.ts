import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Ignore ESLint errors during build to allow deployment
    // ESLint is still run separately in regression tests via npm run lint
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
