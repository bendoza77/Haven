"use client";

import { useMoney } from "@/lib/format";
import { cn, discountPercent } from "@/lib/utils";

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
