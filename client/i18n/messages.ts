import { getMessages } from "next-intl/server";

/**
 * What the browser is allowed to be told.
 *
 * The dictionary is one file per language, and the server reads all of it —
 * that costs nothing, because a Server Component resolves its own text and
 * ships the result. A Client Component cannot: it needs the messages
 * themselves, and every message handed to `NextIntlClientProvider` is
 * serialised into the HTML of the page.
 *
 * Handed the whole dictionary — which is what happens when the provider is
 * given no `messages` and inherits the server's — the shop was putting 55 kB
 * of English or 118 kB of Georgian into every document, including the staff
 * console's copy and the full text of the privacy policy and the terms, on
 * pages that render none of it. The groups below are what each part of the app
 * actually reads on the client, and nothing else travels.
 *
 * Getting one wrong is visible rather than fatal: next-intl falls back to
 * printing the key. `npm run build` followed by the route sweep in the README
 * is what catches it.
 */

/** Read by the header, the drawer and the footer — so, by every shop page. */
const CHROME = ["header", "nav", "categories", "language", "theme", "auth"] as const;

/**
 * The chrome plus what a product card and its two controls need. Product cards
 * appear on the home page, the shop, a category, search and the saved list, so
 * this is the storefront's floor rather than a per-page addition.
 */
export const STOREFRONT_CLIENT = [
  ...CHROME,
  "product",
  "counts",
  "common",
  "ui",
  "dialog",
] as const;

/** Sign in, register, reset, verify — the forms and their validation. */
export const AUTH_CLIENT = [
  "authForm",
  "validation",
  "twoFactor",
  "resetPassword",
  "verifyEmail",
  "login",
  "register",
  "forgotPassword",
] as const;

/** The bag, the checkout flow and the order summary beside it. */
export const CHECKOUT_CLIENT = ["cart", "checkout", "summary", "addresses", "validation"] as const;

/** The profile screen: details, orders, addresses, two-step setting. */
export const ACCOUNT_CLIENT = [
  "account",
  "addresses",
  "orders",
  "summary",
  "twoFactor",
  "validation",
] as const;

/** A product page: gallery, options, purchase controls and the reviews. */
export const PRODUCT_CLIENT = ["reviews"] as const;

/** Shop and category: the sort control. */
export const BROWSE_CLIENT = ["browser", "sort", "filters"] as const;

/** The saved list. */
export const WISHLIST_CLIENT = ["wishlist"] as const;

/**
 * The staff consoles, which are almost entirely client-rendered — tables that
 * sort, forms that save, dialogs that confirm. They are behind a role check
 * and never reached by a shopper, so their 13 kB (27 kB in Georgian) is paid
 * only by the handful of people who open them.
 */
export const CONSOLE_CLIENT = [
  "console",
  "categories",
  "product",
  "orders",
  "summary",
  "account",
  "addresses",
  "counts",
  "common",
  "ui",
  "dialog",
  "auth",
  "validation",
  "reviews",
  "authForm",
  "theme",
  "language",
] as const;

type Messages = Awaited<ReturnType<typeof getMessages>>;

/**
 * The named namespaces, and only those.
 *
 * Duplicates are harmless — the groups above overlap on purpose, so a caller
 * can spread two of them without first working out what they share.
 */
export async function clientMessages(...groups: readonly (readonly string[])[]) {
  const all = (await getMessages()) as Messages;
  const wanted = new Set(groups.flat());

  const picked: Record<string, unknown> = {};
  for (const namespace of wanted) {
    if (namespace in all) picked[namespace] = (all as Record<string, unknown>)[namespace];
  }

  return picked as Messages;
}
