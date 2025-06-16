/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Remove the deprecated experimental.appDir option
  // The app directory is enabled by default in Next.js 13.4+
}

module.exports = nextConfig