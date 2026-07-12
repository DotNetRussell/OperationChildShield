import { NextRequest, NextResponse } from "next/server";

/**
 * Strict CSP with per-request nonces (Next.js 16 proxy convention).
 * Avoids script-src 'unsafe-inline' / 'unsafe-eval' in production.
 * React style={{...}} props use style-src-attr (CSP3); style tags use nonces.
 */
export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";

  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    // Local assets + congress.gov member photos
    "img-src 'self' data: blob: https://www.congress.gov",
    "font-src 'self' data:",
    // Next applies nonces to its style tags; React style attributes need style-src-attr
    `style-src 'self' 'nonce-${nonce}'`,
    "style-src-attr 'unsafe-inline'",
    // Nonce + strict-dynamic: no 'unsafe-inline'. Dev-only eval for React refresh.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    "connect-src 'self'",
    "upgrade-insecure-requests",
  ]
    .join("; ")
    .replace(/\s{2,}/g, " ")
    .trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  // Next.js reads CSP from the request to auto-apply nonces to framework scripts
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set("Content-Security-Policy", csp);

  return response;
}

export const config = {
  matcher: [
    {
      source:
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|jfif|ico)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
