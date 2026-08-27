import type { CartLine } from "@/lib/api";

/** Free delivery from this subtotal up. */
export const SHIPPING_THRESHOLD = 250;
export const STANDARD_SHIPPING = 18;

/**
 * Totals for the bag and the order summary.
 *
 * Prices come from the product records the API resolved onto each line, so
 * the figures follow whatever the console last saved — a shopper never pays
 * against a price that is only in their browser.
 */
export function getOrderSummary(lines: CartLine[]) {
  const subtotal = lines.reduce((total, line) => total + line.product.price * line.quantity, 0);
  const itemCount = lines.reduce((count, line) => count + line.quantity, 0);
  const shipping = subtotal >= SHIPPING_THRESHOLD || subtotal === 0 ? 0 : STANDARD_SHIPPING;

  return { subtotal, shipping, total: subtotal + shipping, itemCount };
}

/** How much more is needed to clear the free-delivery threshold. */
export function remainingForFreeShipping(subtotal: number) {
  return Math.max(0, SHIPPING_THRESHOLD - subtotal);
}
