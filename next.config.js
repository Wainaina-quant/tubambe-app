/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Add your Supabase/Cloudflare Stream domains here once you have them, e.g.:
    // remotePatterns: [{ hostname: '*.supabase.co' }],
  },
};

module.exports = nextConfig;
