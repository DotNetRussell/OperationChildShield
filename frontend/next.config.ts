import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Prefer Caddy for full security headers in prod; hide framework fingerprint here too.
  poweredByHeader: false,
  async redirects() {
    return [
      { source: "/stats", destination: "/metrics", permanent: true },
      { source: "/ai-policy", destination: "/the-facts", permanent: true },
      { source: "/about/ai-policy", destination: "/the-facts", permanent: true },
      // Analytics UI removed; visits stay in server-side SQLite only
      { source: "/analytics", destination: "/", permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.congress.gov",
        pathname: "/img/member/**",
      },
      {
        protocol: "https",
        hostname: "cdn.jsdelivr.net",
        pathname: "/gh/djaiss/mapsicon/**",
      },
    ],
  },
};

export default nextConfig;
