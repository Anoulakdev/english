import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  const basePath = process.env.NODE_ENV === 'production' ? '/english' : '';

  return {
    name: 'English Learning - ຮຽນພາສາອັງກິດ & AI Interactive',
    short_name: 'English Learning',
    description: 'ແອັບພລິເຄຊັນຮຽນຮູ້ຄຳສັບ ແລະ ສົນທະນາພາສາອັງກິດກັບ AI 3,000+ ຄຳສັບ ພ້ອມຄຳແປພາສາລາວ',
    start_url: `${basePath}/`,
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#6366f1',
    orientation: 'portrait-primary',
    scope: `${basePath}/`,
    lang: 'lo',
    icons: [
      {
        src: `${basePath}/icons/icon-192x192.png`,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: `${basePath}/icons/icon-512x512.png`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: `${basePath}/icons/icon-maskable-192x192.png`,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: `${basePath}/icons/icon-maskable-512x512.png`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'AI Roleplay & Chat',
        short_name: 'AI Chat',
        description: 'ສົນທະນາພາສາອັງກິດກັບ AI',
        url: `${basePath}/conversation`,
        icons: [{ src: `${basePath}/icons/icon-192x192.png`, sizes: '192x192' }],
      },
      {
        name: 'Quiz Practice',
        short_name: 'Quiz',
        description: 'ທົດສອບຄຳສັບ',
        url: `${basePath}/quiz`,
        icons: [{ src: `${basePath}/icons/icon-192x192.png`, sizes: '192x192' }],
      },
      {
        name: 'Bookmarked Favorites',
        short_name: 'Favorites',
        description: 'ຄຳສັບທີ່ມັກ',
        url: `${basePath}/favorites`,
        icons: [{ src: `${basePath}/icons/icon-192x192.png`, sizes: '192x192' }],
      },
    ],
  };
}

