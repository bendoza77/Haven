import type { Product } from "@/lib/api";
import { apiBase, internalHeaders } from "@/lib/api-url";

/**
 * The storefront's read side of the catalogue.
 *
 * These run on the server during rendering and mirror the selectors the mock
 * catalogue used to expose, so a page reads the same way it always did — the
 * products behind them are now rows in MongoDB that the consoles write.
 *
 * `no-store` on purpose: an admin who changes a price expects to see it in the
 * shop on the next request, not after a revalidation window.
 */

type ApiList = { status: string; data: Product[] };

let warned = false;

/** Every product the API holds. A failure yields an empty shop, never a crash. */
export async function fetchAllProducts(): Promise<Product[]> {
  try {
    const response = await fetch(`${apiBase()}/products`, {
      cache: "no-store",
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
}

/** Only what a customer is allowed to see. Drafts stay in the console. */
export async function fetchLiveProducts(): Promise<Product[]> {
  const products = await fetchAllProducts();
  return products.filter((product) => product.isActive);
}

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
