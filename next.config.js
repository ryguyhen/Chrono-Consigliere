/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
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
