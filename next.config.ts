import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
    ],
  },
  experimental: {
    serverActions: {},
  },
};

// ✅ Correct export
export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
})(nextConfig);
