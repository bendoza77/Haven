/** Join conditional class names. */
export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

export function formatPrice(value: number) {
  return currency.format(value);
}

/** Percentage saved, used for sale badges. */
export function discountPercent(price: number, previousPrice: number) {
  return Math.round(((previousPrice - price) / previousPrice) * 100);
}
