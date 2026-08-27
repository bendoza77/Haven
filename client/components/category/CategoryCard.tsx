import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Category } from "@/data/catalog";
import { cn } from "@/lib/utils";

export default function CategoryCard({
  category,
  productCount,
  size = "md",
  priority = false,
}: {
  category: Category;
  productCount?: number;
  size?: "md" | "lg";
  priority?: boolean;
}) {
  const t = useTranslations("categories");
  const tCounts = useTranslations("counts");

  return (
    <Link
      href={`/category/${category.slug}`}
      className="group relative flex overflow-hidden rounded-lg bg-surface"
    >
      <div className={cn("relative w-full", size === "lg" ? "aspect-4/5 lg:aspect-3/4" : "aspect-4/3")}>
        <Image
          src={category.image}
          alt=""
          fill
          sizes={size === "lg" ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"}
          priority={priority}
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-linear-to-t from-feature/85 via-feature/35 to-feature/5" />
      </div>

      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 sm:p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-feature-ink/70">
            {t(`${category.slug}.tagline`)}
          </p>
          <h3
            className={cn(
              "mt-1 font-display tracking-tight text-feature-ink",
              size === "lg" ? "text-3xl sm:text-4xl" : "text-2xl",
            )}
          >
            {t(`${category.slug}.name`)}
          </h3>
          {productCount !== undefined && (
            <p className="mt-1 text-xs text-feature-ink/70">
              {tCounts("products", { count: productCount })}
            </p>
          )}
        </div>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-feature-ink/15 text-feature-ink ring-1 ring-feature-ink/30 backdrop-blur transition-colors group-hover:bg-feature-ink group-hover:text-feature">
          <ArrowUpRight className="size-4" aria-hidden />
        </span>
      </div>
    </Link>
  );
}
