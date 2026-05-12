import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  reactStrictMode: false, // Required for BlockNote compatibility with Next.js 15/React 19
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Fix for html2pdf.js/fflate - 'module' doesn't exist in browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        module: false,
      };
    }

    // Exclude Playwright MCP output from the file watcher so snapshot/screenshot
    // writes don't trigger HMR rebuilds. Replace watchOptions entirely — the
    // existing object may be frozen. Use glob strings (webpack always accepts these).
    config.watchOptions = {
      ignored: ['**/.playwright-mcp/**', '**/node_modules/**'],
    }

    return config;
  },
};

export default withBundleAnalyzer(nextConfig);

