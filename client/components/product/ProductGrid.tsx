import ProductCard from "@/components/product/ProductCard";
import type { Product } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function ProductGrid({
  products,
  columns = 4,
  priorityCount = 0,
  className,
}: {
  products: Product[];
  columns?: 2 | 3 | 4;
  priorityCount?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:gap-y-14",
        columns === 4 && "lg:grid-cols-4",
        columns === 3 && "sm:grid-cols-2 lg:grid-cols-3",
        className,
      )}
    >
      {products.map((product, index) => (
        <ProductCard
          key={product._id}
          product={product}
          priority={index < priorityCount}
        />
      ))}
    </div>
  );
}
