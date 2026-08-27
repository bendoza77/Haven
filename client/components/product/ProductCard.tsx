import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import ProductCardActions from "@/components/product/ProductCardActions";
import Badge from "@/components/ui/Badge";
import Price from "@/components/ui/Price";
import Rating from "@/components/ui/Rating";
import { getCategory } from "@/data/catalog";
import type { Product } from "@/lib/api";
import { cn, discountPercent } from "@/lib/utils";

/* The badge is a fixed set of three values in the database rather than free
   text, so it maps to a message key like any other label. */
const badgeTones = {
  New: "new",
  Sale: "sale",
  Bestseller: "bestseller",
} as const;

const badgeKeys = {
  New: "new",
  Sale: "sale",
  Bestseller: "bestseller",
} as const;

export default function ProductCard({
  product,
  priority = false,
  className,
}: {
  product: Product;
  priority?: boolean;
  className?: string;
}) {
  const t = useTranslations("product");
  const tCat = useTranslations("categories");

  const category = getCategory(product.category);
  const hoverImage = product.images[1] ?? product.image;

  return (
    <article className={cn("group flex flex-col", className)}>
      <div className="relative overflow-hidden rounded-lg bg-surface">
        <Link
          href={`/product/${product.slug}`}
          className="relative block aspect-4/5"
          tabIndex={-1}
          aria-hidden
        >
          <Image
            src={product.image}
            alt=""
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            priority={priority}
            className="object-cover transition-[opacity,transform] duration-500 group-hover:scale-[1.03] group-hover:opacity-0"
          />
          <Image
            src={hoverImage}
            alt=""
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover opacity-0 transition-[opacity,transform] duration-500 group-hover:scale-[1.03] group-hover:opacity-100"
          />
        </Link>

        <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1.5">
          {product.badge && (
            <Badge tone={badgeTones[product.badge]}>
              {t(`badge.${badgeKeys[product.badge]}`)}
            </Badge>
          )}
          {product.previousPrice && !product.badge && (
            <Badge tone="sale">−{discountPercent(product.price, product.previousPrice)}%</Badge>
          )}
        </div>

        <ProductCardActions product={product} />

      </div>

      <div className="mt-4 flex flex-1 flex-col gap-1.5">
        {category && (
          <p className="text-xs uppercase tracking-[0.12em] text-ink-subtle">
            {tCat(`${category.slug}.name`)}
          </p>
        )}
        <h3 className="text-[0.9375rem] leading-snug font-medium text-ink">
          <Link href={`/product/${product.slug}`} className="transition-colors hover:text-accent">
            {product.name}
          </Link>
        </h3>
        <Rating value={product.rating} reviewCount={product.reviewCount} />
        <Price price={product.price} previousPrice={product.previousPrice} className="mt-1" />
      </div>
    </article>
  );
}
