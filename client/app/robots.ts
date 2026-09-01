import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/**
 * What a crawler may fetch, and where the map is.
 *
 * There was no robots.txt at all, so /robots.txt answered 404. That is not
 * neutral: it costs the site the one place a crawler looks for the sitemap,
 * and leaves the private screens to be found and fetched on their own.
 *
 * The disallow list below is about crawl budget, not secrecy — a URL that is
 * merely disallowed can still be listed if something links to it, because the
 * crawler is told not to *fetch* it rather than not to show it. The screens
 * that must never appear in a result carry `noIndex` on the page itself (see
 * lib/seo.ts); this stops the crawler wasting fetches on pages that mean
 * nothing without a session.
 *
 * /api is excluded because it answers JSON, and a crawler that indexes it
 * competes with the pages that render the same data.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/*/account",
          "/*/cart",
          "/*/checkout",
          "/*/wishlist",
          "/*/login",
          "/*/register",
          "/*/forgot-password",
          "/*/reset-password/",
          "/*/verify-email/",
          "/*/admin-console",
          "/*/moderator-console",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
