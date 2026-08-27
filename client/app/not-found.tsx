import StorefrontChrome from "@/components/layout/StorefrontChrome";
import NotFoundBody from "@/components/layout/NotFoundBody";

/**
 * The 404 for URLs that match no route at all. It sits at the root of `app/`,
 * outside the `(storefront)` group, so it has to bring the shop's frame with
 * it. Routes inside the group use the sibling boundary below it instead.
 */
export default function NotFound() {
  return (
    <StorefrontChrome>
      <NotFoundBody />
    </StorefrontChrome>
  );
}
