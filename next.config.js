/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 2592000, // 30 days — scraper images are stable
    remotePatterns: [
      { protocol: 'https', hostname: '**.craftandtailored.com' },
      { protocol: 'https', hostname: '**.analogshift.com' },
      { protocol: 'https', hostname: '**.bulangandsons.com' },
      { protocol: 'https', hostname: '**.highendtime.com' },
      { protocol: 'https', hostname: '**.greyandpatina.com' },
      { protocol: 'https', hostname: '**.mentawatches.com' },
      { protocol: 'https', hostname: '**.shopify.com' },
      { protocol: 'https', hostname: 'cdn.shopify.com' },
      { protocol: 'https', hostname: '**.myshopify.com' },
      // Catch-all for scraper images
      { protocol: 'https', hostname: '**' },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'playwright'],
  },
};

module.exports = nextConfig;
