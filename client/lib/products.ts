import { cache } from "react";
import type { Product } from "@/lib/api";
import { apiBase, internalHeaders } from "@/lib/api-url";

/**
 * The storefront's read side of the catalogue.
 *
 * These run on the server during rendering and mirror the selectors the mock
 * catalogue used to expose, so a page reads the same way it always did — the
 * products behind them are now rows in MongoDB that the consoles write.
 *
 * Two layers of caching sit under all of them, and they solve different
 * problems:
 *
 *   `cache()`   — one request per *render*. The home page asks for four
 *                 different slices of the catalogue, the product page asks
 *                 twice; each of those was a separate round trip to the API
 *                 for the same list. React's cache collapses them into one.
 *
 *   `revalidate`— one request per *minute*, across all visitors. This is the
 *                 change that matters for time-to-first-byte: `no-store` meant
 *                 every visitor waited on the API before any HTML could be
 *                 written, and the API returns the entire collection.
 *
 * The comment that used to be here argued for `no-store` on the grounds that
 * an admin changing a price expects to see it immediately. That is still true,
 * and still holds — the list is tagged, and the consoles purge the tag after a
 * write (see app/internal/revalidate/route.ts), so an edit is live at once.
 * A minute is only how long a *stale* catalogue can survive without anybody
 * touching it.
 */

type ApiList = { status: string; data: Product[] };

/** How long the catalogue may go unchecked when nothing purges it. */
const CATALOGUE_TTL = 60;

/** The cache tag the consoles purge after writing a product. */
export const CATALOGUE_TAG = "catalogue";

let warned = false;

/**
 * Every product the API holds. A failure yields an empty shop, never a crash.
 *
 * Wrapped in `cache()` so the several selectors a single page calls share one
 * response rather than one each.
 */
export const fetchAllProducts = cache(async (): Promise<Product[]> => {
  try {
    const response = await fetch(`${apiBase()}/products`, {
      next: { revalidate: CATALOGUE_TTL, tags: [CATALOGUE_TAG] },
      headers: internalHeaders(),
    });

    if (!response.ok) throw new Error(`API answered ${response.status}`);

    const body: ApiList = await response.json();
    return body.data ?? [];
  } catch (error) {
    /* Once per process is enough — this would otherwise shout on every render
       of every page while the API is down. */
    if (!warned) {
      warned = true;
      console.warn(
        `[catalogue] Could not reach ${apiBase()}/products — the shop will render empty. ${
          error instanceof Error ? error.message : error
        }`,
      );
    }
    return [];
  }
});

/** Only what a customer is allowed to see. Drafts stay in the console. */
export const fetchLiveProducts = cache(async (): Promise<Product[]> => {
  const products = await fetchAllProducts();
  return products.filter((product) => product.isActive);
});

export async function getProduct(slug: string) {
  const products = await fetchLiveProducts();
  return products.find((product) => product.slug === slug);
}

export async function getProductsByCategory(category: string) {
  const products = await fetchLiveProducts();
  return products.filter((product) => product.category === category);
}

export async function getCollection(
  collection: "featured" | "new" | "popular",
  limit?: number,
) {
  const products = await fetchLiveProducts();
  const matches = products.filter((product) => product.collections?.includes(collection));
  return limit ? matches.slice(0, limit) : matches;
}

export async function getRelatedProducts(product: Product, limit = 4) {
  const products = await fetchLiveProducts();
  return products
    .filter((item) => item.category === product.category && item._id !== product._id)
    .slice(0, limit);
}

export async function searchProducts(query: string) {
  const term = query.trim().toLowerCase();
  if (!term) return [];

  const products = await fetchLiveProducts();

  return products.filter((product) =>
    [product.name, product.category, product.description]
      .join(" ")
      .toLowerCase()
      .includes(term),
  );
}

/** How many live products sit in each category, for the category cards. */
export async function countByCategory() {
  const products = await fetchLiveProducts();

  return products.reduce<Record<string, number>>((counts, product) => {
    counts[product.category] = (counts[product.category] ?? 0) + 1;
    return counts;
  }, {});
}

/**
 * Every review on one product, read on the server.
 *
 * The product page used to fetch these from the browser, in an effect, after
 * hydration — which meant the reviews were absent from the HTML entirely. A
 * crawler never saw them, and neither did a reader until three round trips
 * after the page appeared. Read here they arrive with the markup; the client
 * component still owns writing and re-reading them.
 */
export const fetchReviews = cache(async (slug: string) => {
  try {
    const response = await fetch(`${apiBase()}/products/${encodeURIComponent(slug)}/reviews`, {
      next: { revalidate: CATALOGUE_TTL, tags: [CATALOGUE_TAG, `reviews:${slug}`] },
      headers: internalHeaders(),
    });

    if (!response.ok) throw new Error(`API answered ${response.status}`);

    const body = (await response.json()) as { data?: unknown[] };
    return (body.data ?? []) as import("@/lib/api").Review[];
  } catch {
    /* An unreachable review list is not a broken product page — the client
       component retries on mount and shows its own error if that fails too. */
    return [];
  }
});
