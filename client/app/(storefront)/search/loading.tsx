import Container from "@/components/ui/Container";
import { ProductGridSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <>
      <div className="border-b border-line bg-surface">
        <Container>
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 py-12 lg:py-16">
            <Skeleton className="h-11 w-40" />
            <Skeleton className="h-13 w-full" />
          </div>
        </Container>
      </div>
      <Container className="py-10 lg:py-14">
        <ProductGridSkeleton />
      </Container>
    </>
  );
}
