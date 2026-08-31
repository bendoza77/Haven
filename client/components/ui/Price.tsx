import { useMoney } from "@/lib/format";
import { cn, discountPercent } from "@/lib/utils";

/**
 * A price, written the way the reader's language writes prices.
 *
 * A Server Component: there is nothing interactive here, and it is rendered
 * once per product card on pages that show twelve of them. It used to be a
 * Client Component purely because `useMoney` lived behind a "use client"
 * boundary — so the whole grid of prices shipped and hydrated to do formatting
 * the server had already done.
 */
export default function Price({
  price,
  previousPrice,
  size = "md",
  showDiscount = false,
  className,
}: {
  price: number;
  previousPrice?: number;
  size?: "sm" | "md" | "lg";
  showDiscount?: boolean;
  className?: string;
}) {
  const money = useMoney();

  const sizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-2xl",
  };

  return (
    <p className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-1", sizes[size], className)}>
      <span className="font-medium text-ink">{money(price)}</span>
      {previousPrice && (
        <span className="text-ink-subtle line-through">{money(previousPrice)}</span>
      )}
      {previousPrice && showDiscount && (
        <span className="text-sm font-medium text-accent">
          −{discountPercent(price, previousPrice)}%
        </span>
      )}
    </p>
  );
}
