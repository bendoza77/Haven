/**
 * Static site-wide content: brand details and navigation maps.
 *
 * Link labels are message keys rather than English strings — the shape of the
 * navigation is a structural fact, the wording is a translation. Consumers
 * resolve them against the `nav` namespace, so adding a language never means
 * editing this file.
 */
export const site = {
  name: "Haven",
  email: "hello@haven.store",
  phone: "+1 (555) 010-2400",
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
