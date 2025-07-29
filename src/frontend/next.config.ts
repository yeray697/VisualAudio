import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
});

const nextConfig: NextConfig = withPWA({
  reactStrictMode: true,
  images: {
    domains: ['localhost']
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:5012/api/:path*", // tu API en desarrollo
      },
    ];
  },
});

export default nextConfig;
