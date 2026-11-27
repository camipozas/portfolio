import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    globalNotFound: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "d3j0xmrk71qrvn.cloudfront.net",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
