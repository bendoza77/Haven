/**
 * Static presentation copy for the storefront: the category cards and the
 * editorial photography. The products themselves live in MongoDB and are
 * read through lib/products.ts.
 *
 * The category *text* is not here — name, tagline and description are
 * translated, so they live in the `categories` message namespace keyed by the
 * same slug. What stays here is the part that is identical in every language:
 * which categories exist, in what order, and which photograph belongs to each.
 */

export type Collection = "featured" | "new" | "popular";

export type Category = {
  slug: string;
  image: string;
};

/** Build an Unsplash source URL at a sensible upstream width. */
const u = (id: string, w = 1400) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

/** Photography used for editorial sections rather than a single product. */
export const editorial = {
  hero: u("photo-1578500494198-246f612d3b3d", 1800),
  heroSecondary: u("photo-1616486338812-3dadae4b4ace", 1000),
  promo: u("photo-1608063615781-e2ef8c73d114", 1600),
};

export const categories: Category[] = [
  { slug: "furniture", image: u("photo-1578500494198-246f612d3b3d") },
  { slug: "lighting", image: u("photo-1540932239986-30128078f3c5") },
  { slug: "decor", image: u("photo-1513161455079-7dc1de15ef3e") },
  { slug: "kitchen", image: u("photo-1590794056226-79ef3a8147e1") },
  { slug: "apparel", image: u("photo-1544022613-e87ca75a784a") },
  { slug: "accessories", image: u("photo-1590874103328-eac38a683ce7") },
  { slug: "audio", image: u("photo-1505740420928-5e560c06d30e") },
];

/* ---------------------------------------------------------- selectors */

export function getCategory(slug: string) {
  return categories.find((category) => category.slug === slug);
}
