import Container from "@/components/ui/Container";
import { ProductGridSkeleton, Skeleton } from "@/components/ui/Skeleton";

/** Placeholder for the shop, category and search listings. */
export default function CatalogSkeleton() {
  return (
    <>
      <div className="border-b border-line bg-surface">
        <Container>
          <div className="space-y-4 py-8 lg:py-12">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-11 w-64" />
            <Skeleton className="h-4 w-full max-w-md" />
          </div>
        </Container>
      </div>

      <Container className="py-10 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-14">
          <div className="hidden space-y-6 lg:block">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="space-y-3">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-28" />
              </div>
            ))}
          </div>
          <ProductGridSkeleton />
        </div>
      </Container>
    </>
  );
}
