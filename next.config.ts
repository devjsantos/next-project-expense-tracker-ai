import type { NextConfig } from "next";
import withPWA from "next-pwa";
import env from '@/lib/env';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
      {
        protocol: "https",
        hostname: "smartjuanpeso-ai.vercel.app",
      },
    ],
  },
  experimental: {
    serverActions: {},
  },
};

export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: env.NODE_ENV === "development",
})(nextConfig);