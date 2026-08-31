import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

/**
 * The dictionary and the formats for one request.
 *
 * The locale is read from the `[locale]` route segment rather than from
 * cookies and Accept-Language. That is not a tidying-up: `cookies()` and
 * `headers()` are dynamic functions, and calling either here opted every route
 * in the app — the privacy page, the sign-in page, the 404 — into being
 * re-rendered per request, because this config runs on every render there is.
 * Reading the segment instead lets a page be prerendered and served from the
 * edge. Negotiating from the cookie and the browser's preference still
 * happens; it happens once, in the middleware, which is where a redirect can
 * actually be issued.
 *
 * The whole dictionary is loaded here, and that is fine — this runs on the
 * server and none of it crosses the wire. What reaches the browser is chosen
 * deliberately in i18n/messages.ts.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

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
