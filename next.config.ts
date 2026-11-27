import type { NextConfig } from 'next';

// No script-src: next-themes and hydration rely on inline scripts.
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  {
    key: 'Content-Security-Policy',
    value:
      "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'",
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
];

const nextConfig: NextConfig = {
  headers: async () => [{ source: '/:path*', headers: securityHeaders }],
  experimental: {
    globalNotFound: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'd3j0xmrk71qrvn.cloudfront.net',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
