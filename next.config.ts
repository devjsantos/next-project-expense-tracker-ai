import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ['img.clerk.com'], // allow Clerk's image CDN
  },
};

export default nextConfig;
