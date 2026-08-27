/**
 * The locale contract, shared by the server request config, the switcher and
 * the pre-paint script. Everything that needs to know "which languages exist"
 * reads it from here so the list cannot drift.
 */
export const locales = ["en", "ka"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

/** The cookie next-intl reads on the server to pick a dictionary. */
export const localeCookie = "NEXT_LOCALE";

/** A year: the choice is a preference, not a session detail. */
export const localeCookieMaxAge = 60 * 60 * 24 * 365;

/**
 * Native names, not English ones — a reader looking for Georgian is looking
 * for "ქართული", not for "Georgian".
 */
export const localeLabels: Record<Locale, { native: string; short: string }> = {
  en: { native: "English", short: "EN" },
  ka: { native: "ქართული", short: "KA" },
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}
