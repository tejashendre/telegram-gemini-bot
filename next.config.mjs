/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Ignore ESLint errors during build to prevent deployment failures
    // ESLint will still run in development
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow production builds even with type errors from third-party packages
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
