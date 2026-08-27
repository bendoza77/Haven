import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { defaultLocale, isLocale, localeCookie, locales, type Locale } from "./config";

/**
 * Second-guess the cookie with the browser's own preference, so a first-time
 * Georgian visitor is not shown English before they find the switcher. Parsed
 * by hand rather than pulled in as a dependency: the header is small and the
 * quality-value grammar is two rules wide.
 */
function fromAcceptLanguage(header: string | null): Locale | undefined {
  if (!header) return undefined;

  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return { tag: tag.trim().toLowerCase(), q: q ? Number(q.split("=")[1]) : 1 };
    })
    .filter((entry) => entry.tag && !Number.isNaN(entry.q))
    .sort((a, b) => b.q - a.q);

  // Match on the primary subtag so "ka-GE" and "en-US" both land.
  for (const { tag } of ranked) {
    const base = tag.split("-")[0];
    const hit = locales.find((locale) => locale === base);
    if (hit) return hit;
  }

  return undefined;
}

export default getRequestConfig(async () => {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);

  const stored = cookieStore.get(localeCookie)?.value;
  const locale = isLocale(stored)
    ? stored
    : (fromAcceptLanguage(headerStore.get("accept-language")) ?? defaultLocale);

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    /* Named formats, defined once here so a price or a date cannot be
       formatted two different ways on two different screens. The currency
       is a property of the store (it sells in USD); how that amount is
       written down is a property of the locale. */
    formats: {
      number: {
        currency: {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 2,
        },
      },
      dateTime: {
        long: { day: "numeric", month: "long", year: "numeric" },
        short: { day: "numeric", month: "short", year: "numeric" },
        monthYear: { month: "long", year: "numeric" },
        monthOnly: { month: "short" },
      },
    },
    onError(error) {
      // A missing key should surface in development and never take down a
      // production render.
      if (process.env.NODE_ENV === "development") console.error(error);
    },
  };
});
