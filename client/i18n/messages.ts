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
 * Two rules keep them honest, because getting one wrong is not fatal — next-intl
 * prints the key instead of the sentence, which is how "account.loading" and
 * "authForm.signIn" came to be rendered on the live shop:
 *
 *   1. A group lists what a *client* component under that route calls
 *      `useTranslations` with. Text a Server Component resolves with
 *      `getTranslations` never belongs here; it is already words by the time
 *      it is serialised.
 *   2. Every route whose subtree needs more than STOREFRONT_CLIENT declares it
 *      in a `layout.tsx` beside the page, through `<PageMessages>`. The groups
 *      existing is not enough — they have to be attached to a route.
 *
 * `npm run build` followed by the route sweep in the README is what catches a
 * missed one; grep the rendered HTML for `namespace.` and there should be no
 * hits.
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

/**
 * Sign in, register, reset, verify.
 *
 * `authForm` is the fields and the buttons, `validation` the messages
 * `useValidationMessage` produces from them. `resetPassword` and `verifyEmail`
 * belong to the two token screens, which are client components because they
 * act on the token as soon as they mount. `login`, `register` and
 * `forgotPassword` are deliberately absent — that copy is resolved on the
 * server by the page itself and arrives as text.
 */
export const AUTH_CLIENT = ["authForm", "validation", "resetPassword", "verifyEmail"] as const;

/** The bag: lines, quantities and the summary column beside them. */
export const CART_CLIENT = ["cart", "summary"] as const;

/** The checkout flow — address form, delivery choice, order summary. */
export const CHECKOUT_CLIENT = [
  "checkout",
  "cart",
  "summary",
  "addresses",
  "validation",
] as const;

/** The profile screen: details, orders, addresses, two-step setting. */
export const ACCOUNT_CLIENT = [
  "account",
  "addresses",
  "orders",
  "summary",
  "twoFactor",
  "validation",
] as const;

/** A product page: the gallery, the purchase controls and the reviews. */
export const PRODUCT_CLIENT = ["reviews"] as const;

/** Shop and category: the sort control. */
export const BROWSE_CLIENT = ["browser"] as const;

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
 *
 * The locale is passed in rather than inferred, and that is not tidiness. Left
 * to work it out, `getMessages()` reads `requestLocale` — a dynamic read — and
 * any route with a layout that calls this is dropped from static generation
 * wholesale. It cost the product pages exactly that: adding a provider for the
 * reviews turned 42 prerendered, edge-served pages into 42 that were rendered
 * from scratch on every request, with no error and no warning. Naming the
 * locale keeps the read static, so the pages stay built.
 *
 * `undefined` is still accepted, for the one caller that has no segment to read
 * it from — the not-found boundary, which is dynamic anyway.
 */
export async function clientMessages(
  locale: string | undefined,
  ...groups: readonly (readonly string[])[]
) {
  const all = (await (locale ? getMessages({ locale }) : getMessages())) as Messages;
  const wanted = new Set(groups.flat());

  const picked: Record<string, unknown> = {};
  const missing: string[] = [];

  for (const namespace of wanted) {
    if (namespace in all) picked[namespace] = (all as Record<string, unknown>)[namespace];
    else missing.push(namespace);
  }

  /* A group naming a namespace the dictionary does not have is a typo, and its
     only symptom in production is a message key printed where a sentence
     should be — which is how `account.loading` and `authForm.signIn` reached
     the live shop unnoticed. Loud in development, silent in production: a
     half-translated page is still a page, and refusing to render one over a
     missing string would be the worse failure. */
  if (process.env.NODE_ENV === "development" && missing.length) {
    console.error(
      `[i18n] No such namespace: ${missing.join(", ")}. ` +
        "Check the groups in i18n/messages.ts against the keys in messages/en.json.",
    );
  }

  return picked as Messages;
}
