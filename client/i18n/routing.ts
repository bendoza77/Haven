import { defineRouting } from "next-intl/routing";
import { defaultLocale, localeCookie, localeCookieMaxAge, locales } from "./config";

/**
 * How a locale is expressed in a URL.
 *
 * `as-needed` keeps English on the paths it has always had — /shop stays
 * /shop — and gives Georgian its own: /ka/shop. Nothing that was already
 * linked to, bookmarked or indexed moves.
 *
 * Putting the locale in the path rather than in a cookie alone is what makes
 * the two expensive problems go away at once. Switching language becomes a
 * prefetched client navigation instead of a server refresh that re-runs every
 * query on the page; and each language finally has an address, which is the
 * precondition for hreflang, per-language canonicals and a sitemap that lists
 * both. A cookie cannot be linked to, so a cookie-only locale can never be
 * indexed.
 *
 * The cookie is still written — by the middleware, on a switch — so a returning
 * visitor lands on the language they chose. It is now a hint about where to
 * send someone, not the thing that decides what a page says.
 */
export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "as-needed",
  localeCookie: {
    name: localeCookie,
    maxAge: localeCookieMaxAge,
    sameSite: "lax",
  },
});
