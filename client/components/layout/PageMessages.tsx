import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { STOREFRONT_CLIENT, clientMessages } from "@/i18n/messages";

/**
 * The dictionary for one route's client components.
 *
 * `StorefrontChrome` gives every shop page a floor — the header, the drawer,
 * the footer and a product card. Anything heavier than that (the bag, the
 * checkout, the profile, the reviews, the sort control) needs namespaces the
 * floor does not carry, and a `NextIntlClientProvider` that is handed
 * `messages` *replaces* what an outer one provided rather than merging with
 * it. So this repeats the floor and adds to it; a route that renders it gets
 * exactly one working dictionary, and a route that does not is unaffected.
 *
 * Repeating the floor costs about 5 kB of JSON in the document, all of it a
 * verbatim second copy of text already there — which is the case compression
 * handles best, and a few hundred bytes on the wire. Without it these screens
 * printed their message keys: `account.loading` where the profile should have
 * been, `authForm.signIn` on the sign-in button, `cart.loading` on the bag.
 *
 * It goes in a `layout.tsx` beside the page rather than inside the page, so
 * the provider survives navigation within the segment instead of being torn
 * down and rebuilt on every search-param change.
 *
 * The locale comes down as a prop and is set on the request before the
 * dictionary is read. Both halves matter: without them this layout resolves
 * the locale dynamically and every route underneath it stops being
 * prerenderable — see the note in i18n/messages.ts.
 */
export default async function PageMessages({
  locale,
  groups,
  children,
}: {
  locale: string;
  /** Namespace groups from i18n/messages.ts that this route's client needs. */
  groups: readonly (readonly string[])[];
  children: React.ReactNode;
}) {
  setRequestLocale(locale);

  const messages = await clientMessages(locale, STOREFRONT_CLIENT, ...groups);

  return <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>;
}
