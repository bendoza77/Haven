import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Points the plugin at the request config; without an argument it looks for
// ./i18n/request.ts, but naming it keeps the wiring greppable.
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/**
 * Where the Express API is deployed, with no trailing slash.
 *
 * Read at build time, so it has to be set on the Vercel project before the
 * build runs. Empty means "no proxy" — the setup where the browser talks to
 * the API directly, which is what happens when NEXT_PUBLIC_API_URL is pointed
 * at an absolute URL for local development.
 */
const apiOrigin = process.env.API_ORIGIN?.replace(/\/+$/, "") ?? "";

/* Uploaded photography is stored in MongoDB and served from /api/media/<id>,
   which the proxy below covers. Products seeded before that change may still
   hold an absolute URL on the API host, so that host is allowed here too. */
const apiHost = apiOrigin ? new URL(apiOrigin).hostname : null;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/photo-**",
      },
      // Photography uploaded through the consoles on a local API.
      {
        protocol: "http",
        hostname: "localhost",
        port: "3001",
        pathname: "/**",
      },
      ...(apiHost
        ? [
            {
              protocol: "https" as const,
              hostname: apiHost,
              pathname: "/**",
            },
          ]
        : []),
    ],
  },

  /**
   * The API, served under the storefront's own origin.
   *
   * The session is an httpOnly cookie. A cookie sent from this page to an API
   * on another domain is a third-party cookie — Safari blocks those outright
   * and Chrome is removing them, which would break signing in for a real share
   * of visitors with no error worth reading. Proxying /api through this
   * deployment makes the cookie first-party, so it simply works.
   *
   * It also means Google's OAuth callback lands on this domain, which is why
   * GOOGLE_CALLBACK_URL points here and not at the API.
   */
  async rewrites() {
    if (!apiOrigin) return [];

    return [
      { source: "/api/:path*", destination: `${apiOrigin}/api/:path*` },
      // Photography uploaded by an older, disk-backed build of the API.
      { source: "/uploads/:path*", destination: `${apiOrigin}/uploads/:path*` },
    ];
  },
};

export default withNextIntl(nextConfig);
