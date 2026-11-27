import type { Metadata } from 'next';
import { CLOUDFRONT_BASE } from '@/lib/data';

const CLOUDFRONT = `${CLOUDFRONT_BASE}/public`;

/** Favicons for every root layout: the site, the backoffice and the global 404. */
export const siteIcons: Metadata['icons'] = {
  icon: [
    { url: `${CLOUDFRONT}/favicon.ico`, sizes: 'any' },
    {
      url: `${CLOUDFRONT}/favicon-16x16.png`,
      sizes: '16x16',
      type: 'image/png',
    },
    {
      url: `${CLOUDFRONT}/favicon-32x32.png`,
      sizes: '32x32',
      type: 'image/png',
    },
  ],
  apple: {
    url: `${CLOUDFRONT}/android-chrome-192x192.png`,
    sizes: '192x192',
  },
  other: [
    {
      rel: 'icon',
      url: `${CLOUDFRONT}/android-chrome-384x384.png`,
      sizes: '384x384',
    },
    {
      rel: 'icon',
      url: `${CLOUDFRONT}/android-chrome-512x512.png`,
      sizes: '512x512',
    },
    {
      rel: 'msapplication-TileImage',
      url: `${CLOUDFRONT}/mstile-150x150.png`,
    },
  ],
};
