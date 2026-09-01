import type { MetadataRoute } from "next";
import { categories } from "@/data/catalog";
import { locales } from "@/i18n/config";
import { absoluteUrl } from "@/lib/seo";
import { fetchLiveProducts } from "@/lib/products";

/**
 * Every address worth indexing, in every language it has one in.
 *
 * /sitemap.xml answered 404 before this existed, which meant a crawler had to
 * discover the shop by following links from whatever page it happened to land
 * on. A catalogue is exactly the shape that does badly under that: products
 * three clicks deep, behind a paginated grid, get visited late and re-visited
 * rarely.
 *
 * The `alternates.languages` block on each entry is the load-bearing part. It
 * is the same claim the `hreflang` tags in lib/seo.ts make — that /en/shop and
 * /ka/shop are one page in two languages, not two pages competing for the same
 * queries — and Google wants the two to agree. Stating it here as well is what
 * gets both languages indexed rather than one of them treated as a duplicate.
 *
 * Only public routes are listed. The bag, the checkout, the profile, the
 * sign-in forms and the search results all carry `noIndex` on the page and are
 * disallowed in robots.ts; listing any of them here would be this file
 * contradicting the other two, and a crawler handed two different answers
 * about the same URL trusts neither.
 */

/** Routes that exist for every locale, with how strongly each is weighted. */
const STATIC_ROUTES: { path: string; priority: number; changeFrequency: Frequency }[] = [
  { path: "/", priority: 1, changeFrequency: "daily" },
  { path: "/shop", priority: 0.9, changeFrequency: "daily" },
  { path: "/categories", priority: 0.8, changeFrequency: "weekly" },
  { path: "/terms", priority: 0.2, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.2, changeFrequency: "yearly" },
];

type Frequency = NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;

/**
 * One entry per language for a single route, each pointing at all the others.
 *
 * Generated together rather than by hand: Google discards an alternates set
 * whose references are not mutual, and the only reliable way to keep them
 * mutual is to never write one on its own.
 */
function entries(
  path: string,
  { priority, changeFrequency, lastModified }: {
    priority: number;
    changeFrequency: Frequency;
    lastModified?: Date;
  },
): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(
    locales.map((locale) => [locale, absoluteUrl(locale, path)]),
  );

  return locales.map((locale) => ({
    url: absoluteUrl(locale, path),
    lastModified,
    changeFrequency,
    priority,
    alternates: { languages },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  /* The same cached read the shop pages use, so building the sitemap does not
     add a round trip to the API. An unreachable API yields the static routes
     rather than an empty file — a sitemap that briefly omits the catalogue is
     recoverable; one that says the shop has no pages is not. */
  const products = await fetchLiveProducts();

  return [
    ...STATIC_ROUTES.flatMap((route) =>
      entries(route.path, {
        priority: route.priority,
        changeFrequency: route.changeFrequency,
      }),
    ),

    ...categories.flatMap((category) =>
      entries(`/category/${category.slug}`, {
        priority: 0.7,
        changeFrequency: "weekly",
      }),
    ),

    ...products.flatMap((product) =>
      entries(`/product/${product.slug}`, {
        priority: 0.8,
        changeFrequency: "weekly",
        lastModified: product.updatedAt ? new Date(product.updatedAt) : undefined,
      }),
    ),
  ];
}
