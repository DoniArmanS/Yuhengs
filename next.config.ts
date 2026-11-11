import type { NextConfig } from "next";
import { SERVERS } from "./src/lib/providers";

// The only sites allowed to run in our iframes: the video servers (taken from
// the server list so the two can't drift apart) and Vercel's preview toolbar.
const frameSources = [...new Set(SERVERS.map((s) => new URL(s.url(1, 1, "sub")).origin)), "https://vercel.live"];

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      `frame-src ${frameSources.join(" ")}`,
      // Nobody else may frame Yuhengs (clickjacking).
      "frame-ancestors 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Features Yuhengs never uses, off for the page and every embed. Autoplay,
  // fullscreen and picture-in-picture stay available to the player.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), hid=(), midi=()",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
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
