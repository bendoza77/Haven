import { useFormatter } from "next-intl";

/**
 * Locale-aware money and dates.
 *
 * Every one of these was an `Intl` call pinned to "en-US", which is fine
 * until the page is Georgian: ka groups and separates numbers differently
 * ("1250,50 US$"), and writes dates day-first with its own month names
 * ("27 აგვ. 2026"). Formatting therefore has to follow the active locale
 * rather than the currency.
 *
 * These are hooks rather than plain functions because the locale comes from
 * context. `useFormatter` is exported from next-intl's react-server build as
 * well, so the same hook works in a sync Server Component and in a Client
 * Component — which is exactly the mix that renders prices here. Only async
 * Server Components need `getFormatter` instead.
 *
 * This module deliberately carries no "use client". It had one, and a
 * directive at the top of a module is not a note about where it runs — it is
 * a boundary. Every component that imported a formatter from here was pulled
 * into the client bundle with it, `Price` above all, which meant every price
 * on every product card hydrated in order to call `Intl.NumberFormat`. Without
 * the directive both builds resolve, and each caller decides for itself.
 */

/** Prices stay in USD — the store sells in dollars — but format per locale. */
export function useMoney() {
  const format = useFormatter();
  return (value: number) => format.number(value, "currency");
}

/* Console figures: whole units, no cents. The dashboards count products and
   accounts and show inventory value in round dollars. */
export function useCounts() {
  const format = useFormatter();
  return {
    count: (value: number) => format.number(value, { maximumFractionDigits: 0 }),
    money: (value: number) =>
      format.number(value, { style: "currency", currency: "USD", maximumFractionDigits: 0 }),
  };
}

export function useDates() {
  const format = useFormatter();

  /** Guards the invalid dates the API can return for a missing timestamp. */
  const safe = (value: string | undefined, options: Parameters<typeof format.dateTime>[1]) => {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : format.dateTime(date, options);
  };

  return {
    /** "27 August 2026" — order history, review dates. */
    long: (value?: string) => safe(value, "long"),
    /** "27 Aug 2026" — dense console tables. */
    short: (value?: string) => safe(value, "short"),
    /** "August 2026" — the "member since" line. */
    monthYear: (value?: string) => safe(value, "monthYear"),
    /** "Aug" — chart axis ticks. */
    month: (value: Date) => format.dateTime(value, "monthOnly"),
  };
}
