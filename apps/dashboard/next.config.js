/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@broccoli/contracts'],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;

