import NotFoundBody from "@/components/layout/NotFoundBody";

/**
 * The 404 for a shop route that called `notFound()` — a product slug that is
 * no longer live, say. The group layout above already draws the header and
 * footer, so this renders the body alone.
 */
export default function StorefrontNotFound() {
  return <NotFoundBody />;
}
