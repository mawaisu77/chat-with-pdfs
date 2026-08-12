import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "pdf-parse",
    "pdfjs-dist",
  ],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "img.clerk.com" }],
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
