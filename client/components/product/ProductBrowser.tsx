import { useTranslations } from "next-intl";
import { SlidersHorizontal } from "lucide-react";
import FilterPanel from "@/components/product/FilterPanel";
import ProductGrid from "@/components/product/ProductGrid";
import SortSelect from "@/components/product/SortSelect";
import { ButtonLink } from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/ui/Pagination";
import type { Product } from "@/lib/api";
import { PAGE_SIZE, SORT_OPTIONS, buildQuery, sortProducts, type SortValue } from "@/lib/shop";

/**
 * Shared browsing surface for the shop and category pages: filter sidebar,
 * sort control, product grid and pagination.
 */
export default function ProductBrowser({
  basePath,
  products,
  activeCategory,
  onSale = false,
  sort,
  page,
}: {
  basePath: string;
  products: Product[];
  activeCategory?: string;
  onSale?: boolean;
  sort: SortValue;
  page: number;
}) {
  const t = useTranslations("browser");
  const tSort = useTranslations("sort");

  const filter = onSale ? "sale" : undefined;
  const sorted = sortProducts(products, sort);
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const visible = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  /* The label is resolved here rather than in the select: the options are
     built on the server, where the dictionary is already loaded. */
  const sortOptions = SORT_OPTIONS.map((option) => ({
    ...option,
    label: tSort(option.value),
    href: buildQuery(basePath, { filter, sort: option.value }),
  }));

  const filters = (
    <FilterPanel
      basePath={basePath}
      activeCategory={activeCategory}
      onSale={onSale}
      sort={sort}
    />
  );

  return (
    <Container className="py-10 lg:py-14">
      <div className="grid gap-10 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-14">
        <aside className="hidden lg:block">
          <h2 className="sr-only">{t("filtersHeading")}</h2>
          {filters}
        </aside>

        <div>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-ink-muted">
              {t("showing", { shown: visible.length, total: sorted.length })}
            </p>
            <SortSelect value={sort} options={sortOptions} />
          </div>

          <details className="mb-8 rounded-lg border border-line lg:hidden">
            <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-medium text-ink">
              <SlidersHorizontal className="size-4" aria-hidden />
              {t("filtersHeading")}
            </summary>
            <div className="border-t border-line px-4 py-5">{filters}</div>
          </details>

          {visible.length > 0 ? (
            <>
              <ProductGrid products={visible} priorityCount={4} />
              {totalPages > 1 && (
                <div className="mt-14">
                  <Pagination
                    page={currentPage}
                    totalPages={totalPages}
                    hrefFor={(target) =>
                      buildQuery(basePath, {
                        filter,
                        sort,
                        page: target > 1 ? target : undefined,
                      })
                    }
                  />
                </div>
              )}
            </>
          ) : (
            <EmptyState
              icon={<SlidersHorizontal className="size-6" aria-hidden />}
              title={t("emptyTitle")}
              description={t("emptyBody")}
              actions={<ButtonLink href="/shop">{t("clearFilters")}</ButtonLink>}
            />
          )}
        </div>
      </div>
    </Container>
  );
}
