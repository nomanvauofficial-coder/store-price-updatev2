import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Do NOT set output: "standalone" on Vercel (causes 404).
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
