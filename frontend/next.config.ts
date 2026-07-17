import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // CSP nonces are applied in src/proxy.ts. Caddy sets HSTS/COOP/CORP/COEP.
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
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
