import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

const stars = [1, 2, 3, 4, 5];

export default function Rating({
  value,
  reviewCount,
  className,
}: {
  value: number;
  reviewCount?: number;
  className?: string;
}) {
  const t = useTranslations("product");

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {/* Outlined stars with a clipped filled copy on top, so 4.5 reads as 4.5. */}
      <span className="relative flex" aria-hidden>
        <span className="flex">
          {stars.map((star) => (
            <Star key={star} className="size-3.5 shrink-0 fill-none text-line-strong" strokeWidth={1.5} />
          ))}
        </span>
        <span
          className="absolute inset-y-0 left-0 flex overflow-hidden"
          style={{ width: `${(Math.min(value, 5) / 5) * 100}%` }}
        >
          {stars.map((star) => (
            <Star key={star} className="size-3.5 shrink-0 fill-ink text-ink" strokeWidth={1.5} />
          ))}
        </span>
      </span>
      <span className="text-xs text-ink-subtle">
        {value.toFixed(1)}
        {reviewCount !== undefined && ` (${reviewCount})`}
        <span className="sr-only"> {t("outOfFiveStars")}</span>
      </span>
    </div>
  );
}
