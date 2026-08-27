import {
  defaultLocale,
  isLocale,
  localeCookie,
  localeCookieMaxAge,
  type Locale,
} from "@/i18n/config";

/**
 * The locale lives in a cookie because the server needs it: most of this app
 * renders on the server, so the dictionary is chosen before any JavaScript
 * runs. The helpers below are the only place that cookie is written.
 */
export function readLocaleCookie(): Locale {
  if (typeof document === "undefined") return defaultLocale;

  const match = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${localeCookie}=`));

  const value = match?.slice(localeCookie.length + 1);
  return isLocale(value) ? value : defaultLocale;
}

export function writeLocaleCookie(locale: Locale) {
  // `SameSite=Lax` so the choice survives a normal navigation back from an
  // external payment or OAuth hop, without riding along on cross-site posts.
  document.cookie = `${localeCookie}=${locale}; path=/; max-age=${localeCookieMaxAge}; SameSite=Lax`;
}

/**
 * The document language drives font selection, hyphenation and the CSS that
 * de-tracks Georgian, so it is set eagerly rather than waiting for the server
 * round-trip that `router.refresh()` starts.
 */
export function applyDocumentLocale(locale: Locale) {
  document.documentElement.lang = locale;
}
