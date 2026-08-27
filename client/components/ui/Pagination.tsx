import { useTranslations } from "next-intl";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Pagination({
  page,
  totalPages,
  hrefFor,
}: {
  page: number;
  totalPages: number;
  hrefFor: (page: number) => string;
}) {
  const t = useTranslations("ui");

  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
  const arrow =
    "flex size-10 items-center justify-center rounded-md border border-line text-ink transition-colors hover:border-ink";

  return (
    <nav aria-label={t("paginationLabel")} className="flex items-center justify-center gap-2">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={arrow} aria-label={t("previousPage")}>
          <ChevronLeft className="size-4" aria-hidden />
        </Link>
      ) : (
        <span className={cn(arrow, "cursor-not-allowed text-line-strong")} aria-hidden>
          <ChevronLeft className="size-4" />
        </span>
      )}

      {pages.map((item) => (
        <Link
          key={item}
          href={hrefFor(item)}
          aria-current={item === page ? "page" : undefined}
          className={cn(
            "flex size-10 items-center justify-center rounded-md border text-sm transition-colors",
            item === page
              ? "border-ink bg-ink text-canvas"
              : "border-line text-ink hover:border-ink",
          )}
        >
          {item}
        </Link>
      ))}

      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} className={arrow} aria-label={t("nextPage")}>
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      ) : (
        <span className={cn(arrow, "cursor-not-allowed text-line-strong")} aria-hidden>
          <ChevronRight className="size-4" />
        </span>
      )}
    </nav>
  );
}
