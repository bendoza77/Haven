/**
 * Static site-wide content: brand details and navigation maps.
 *
 * Link labels are message keys rather than English strings — the shape of the
 * navigation is a structural fact, the wording is a translation. Consumers
 * resolve them against the `nav` namespace, so adding a language never means
 * editing this file.
 */

/**
 * Where this deployment answers, with no trailing slash.
 *
 * Every absolute URL the shop publishes is built from it: the canonical link
 * on each page, the hreflang alternates, the sitemap, the Open Graph tags and
 * the structured data. Search engines treat those as identity, so a wrong
 * value here is worse than none — it points the index at somewhere that is not
 * the shop.
 *
 * NEXT_PUBLIC_ because the client bundle links to it too. It is a public
 * address, not a secret.
 *
 * The order of the fallbacks matters more than it looks. VERCEL_URL is the
 * *deployment's* own hostname — haven-f2a6w6dct-…vercel.app — a new one on
 * every push and an address no visitor ever types. Reaching for it first meant
 * production shipped canonicals and Open Graph URLs pointing at a hostname
 * that would be superseded within the day, so every page a crawler indexed
 * named an address that no longer identified the site.
 * VERCEL_PROJECT_PRODUCTION_URL is the stable one — the project's production
 * domain, the same on every deployment — which is what those tags have to say.
 * VERCEL_URL is kept behind it so a preview branch still describes itself
 * rather than claiming to be production, and localhost is the last resort so a
 * developer never sees a production hostname in dev markup.
 *
 * Set NEXT_PUBLIC_SITE_URL once a custom domain exists: it is the only one of
 * these that knows about a domain Vercel did not issue.
 */
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`
    : undefined) ??
  (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : undefined) ??
  "http://localhost:3000"
).replace(/\/+$/, "");

export const site = {
  name: "Haven",
  email: "hello@haven.store",
  phone: "+1 (555) 010-2400",
  url: siteUrl,
} as const;

export const mainNav = [
  { key: "shop", href: "/shop" },
  { key: "categories", href: "/categories" },
  { key: "newArrivals", href: "/shop?sort=newest" },
  { key: "sale", href: "/shop?filter=sale" },
] as const;

/* Sits under the copyright line, and is what the sign-up checkbox links to.
   Kept here so the two places that reference these pages cannot drift. */
export const legalNav = [
  { key: "terms", href: "/terms" },
  { key: "privacy", href: "/privacy" },
] as const;

export const footerNav = [
  {
    key: "shop",
    links: [
      { key: "allProducts", href: "/shop" },
      { key: "furniture", href: "/category/furniture" },
      { key: "lighting", href: "/category/lighting" },
      { key: "apparel", href: "/category/apparel" },
      { key: "accessories", href: "/category/accessories" },
      { key: "audio", href: "/category/audio" },
    ],
  },
  {
    key: "discover",
    links: [
      { key: "allCategories", href: "/categories" },
      { key: "newArrivals", href: "/shop?sort=newest" },
      { key: "onSale", href: "/shop?filter=sale" },
      { key: "bestsellers", href: "/shop?sort=popular" },
      { key: "search", href: "/search" },
    ],
  },
  {
    key: "account",
    links: [
      { key: "signIn", href: "/login" },
      { key: "createAccount", href: "/register" },
      { key: "profile", href: "/account" },
      { key: "orders", href: "/account?tab=orders" },
      { key: "addresses", href: "/account?tab=addresses" },
      { key: "wishlist", href: "/wishlist" },
      { key: "cart", href: "/cart" },
    ],
  },
] as const;

export const socialNav = [
  { key: "instagram", href: "https://www.instagram.com" },
  { key: "pinterest", href: "https://www.pinterest.com" },
  { key: "youtube", href: "https://www.youtube.com" },
] as const;
