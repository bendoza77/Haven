import type { Product } from "@/lib/api";

/* Values only: each doubles as its key in the `sort` message namespace,
   so the visible wording lives with the other translations. */
export const SORT_OPTIONS = [
  { value: "featured" },
  { value: "newest" },
  { value: "popular" },
  { value: "price-asc" },
  { value: "price-desc" },
  { value: "rating" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export const PAGE_SIZE = 12;

export function isSortValue(value: string | undefined): value is SortValue {
  return SORT_OPTIONS.some((option) => option.value === value);
}

/** Order a list of mock products. Sorting happens in memory, on the server. */
export function sortProducts(products: Product[], sort: SortValue) {
  const sorted = [...products];

  switch (sort) {
    case "newest":
      return sorted.sort(
        (a, b) =>
          Number(b.collections.includes("new")) - Number(a.collections.includes("new")),
      );
    case "popular":
      return sorted.sort((a, b) => b.reviewCount - a.reviewCount);
    case "price-asc":
      return sorted.sort((a, b) => a.price - b.price);
    case "price-desc":
      return sorted.sort((a, b) => b.price - a.price);
    case "rating":
      return sorted.sort((a, b) => b.rating - a.rating);
    default:
      return sorted.sort(
        (a, b) =>
          Number(b.collections.includes("featured")) -
          Number(a.collections.includes("featured")),
      );
  }
}

/** Build a URL for the shop-style pages while keeping the other params. */
export function buildQuery(
  base: string,
  params: Record<string, string | number | undefined>,
) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }
  const search = query.toString();
  return search ? `${base}?${search}` : base;
}
