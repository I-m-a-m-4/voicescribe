import type { NextConfig } from "next";

const isTauriBuild = process.env.BUILD_TARGET === "tauri" || process.env.TAURI_ENV === "true";

const nextConfig: NextConfig = {
  ...(isTauriBuild ? { output: "export" } : {}),
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
