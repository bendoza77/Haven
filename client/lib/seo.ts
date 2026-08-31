import type { Metadata } from "next";
import { defaultLocale, locales, type Locale } from "@/i18n/config";
import { siteUrl } from "@/lib/site";

/**
 * The addresses a page has, in every language it has one in.
 *
 * Two languages sharing one URL is the single most damaging thing a
 * multilingual site can do to itself: a crawler sees one address, fetches it
 * once, gets whichever language it happened to be served, and the other
 * language is never indexed at all. Now each has its own path, and the three
 * things below say so to a crawler:
 *
 *   canonical  — this page's own address, so a query string or a stray
 *                variant never competes with it.
 *   languages  — every translation of this page, each pointing at all the
 *                others. Google discards a set where the references are not
 *                mutual, so they are always generated together, never by hand.
 *   x-default  — where to send someone whose language is neither: the English
 *                URL, which is explicitly prefixed like every other route.
 *
 * `path` is the app's own route — "/shop", "/product/oak-chair" — with no
 * locale on it. This is the only place a prefix is added.
 */
export function localePath(locale: Locale, path: string) {
  const clean = path === "/" ? "" : path.replace(/\/+$/, "");
  return `/${locale}${clean}`;
}

export function absoluteUrl(locale: Locale, path: string) {
  const localised = localePath(locale, path);
  return `${siteUrl}${localised === "/" ? "/" : localised}`;
}

export function alternates(locale: Locale, path: string): Metadata["alternates"] {
  const languages: Record<string, string> = {};

  for (const candidate of locales) {
    languages[candidate] = absoluteUrl(candidate, path);
  }

  languages["x-default"] = absoluteUrl(defaultLocale, path);

  return { canonical: absoluteUrl(locale, path), languages };
}

/**
 * Metadata for a page that should be found, shared and ranked.
 *
 * Bundles the four things every indexable page needs and which were previously
 * absent everywhere: its own canonical, its translations, and Open Graph and
 * Twitter cards so a pasted link renders as something rather than as a bare
 * URL. Title and description stay the caller's job — they are the part that
 * has to be specific to the page, and a helper that invented them would
 * produce exactly the duplicate metadata this is meant to prevent.
 */
export function pageMetadata({
  locale,
  path,
  title,
  description,
  images,
  type = "website",
}: {
  locale: Locale;
  path: string;
  title: string;
  description: string;
  images?: string[];
  type?: "website" | "article";
}): Metadata {
  const url = absoluteUrl(locale, path);

  return {
    title,
    description,
    alternates: alternates(locale, path),
    openGraph: {
      type,
      url,
      title,
      description,
      locale,
      ...(images?.length ? { images } : {}),
    },
    twitter: {
      card: images?.length ? "summary_large_image" : "summary",
      title,
      description,
      ...(images?.length ? { images } : {}),
    },
  };
}

/**
 * Pages that exist for one signed-in person and mean nothing in an index: the
 * bag, the checkout, the profile, the sign-in forms, the consoles. Kept out of
 * search results with a robots directive rather than only with robots.txt —
 * a disallowed URL can still be indexed from an inbound link, because the
 * crawler is told not to *fetch* it, not that it should not be listed. Only
 * `noindex` on the page itself actually removes it.
 */
export const noIndex: Metadata = {
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};
