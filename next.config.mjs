/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Ignore ESLint errors during build to prevent deployment failures
    // ESLint will still run in development
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow production builds even with type errors (use with caution)
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
