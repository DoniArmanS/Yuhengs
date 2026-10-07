import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Let phones and other devices on the local network use the dev server
  // (e.g. http://10.139.73.183:3000). Without this, Next.js blocks the dev
  // websocket and the page never hydrates, so no button works.
  allowedDevOrigins: ["10.*.*.*", "192.168.*.*", "172.*.*.*"],
  images: {
    remotePatterns: [new URL("https://s4.anilist.co/**")],
    qualities: [75, 90],
  },
  turbopack: {
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
