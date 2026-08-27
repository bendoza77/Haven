import Container from "@/components/ui/Container";
import { ProductGridSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <>
      <Container className="py-6 lg:py-10">
        <Skeleton className="h-3 w-56" />
        <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-16">
          <Skeleton className="aspect-4/5 w-full rounded-lg" />
          <div className="space-y-5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-11 w-full max-w-sm" />
          </div>
        </div>
      </Container>
      <div className="border-t border-line py-16">
        <Container>
          <ProductGridSkeleton count={4} />
        </Container>
      </div>
    </>
  );
}
