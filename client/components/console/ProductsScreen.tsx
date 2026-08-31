"use client";

import { useEffect, useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { AlertCircle, ArrowUpRight, Loader2, Package, Pencil, Plus, Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/console/ConfirmDialog";
import ConsoleHeader from "@/components/console/ConsoleHeader";
import ReadOnlyNotice from "@/components/console/Notice";
import { StatusPill, StockPill } from "@/components/console/Pills";
import { Table, Td, Th, Thumb, Tr } from "@/components/console/Table";
import { Pager, Toolbar } from "@/components/console/Toolbar";
import { ButtonLink } from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { api, type Product } from "@/lib/api";
import { useCounts, useDates } from "@/lib/format";
import {
  CATEGORIES,
  LOW_STOCK,
  PRODUCT_SORTS,
  type ConsoleConfig,
} from "@/lib/console";

const PAGE_SIZE = 10;

const iconButton =
  "flex size-8 items-center justify-center rounded-md text-ink-subtle transition-colors hover:bg-surface hover:text-ink";

/**
 * The catalogue screen for both consoles.
 *
 * The API answers with the whole catalogue in one call, so searching, filtering
 * and paging all happen here against that array — the toolbar responds on the
 * keystroke rather than on a round trip. The admin console gets edit and delete
 * controls; the moderator console gets the same rows with a link out to the
 * shop, because nothing already in the store is theirs to change.
 */
export default function ProductsScreen({ config }: { config: ConsoleConfig }) {
  const t = useTranslations("console");
  const tCat = useTranslations("categories");
  const locale = useLocale();
  const { count: formatCount, money: formatMoney } = useCounts();
  const dates = useDates();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  /* All four hold language-independent keys: a table filtered in one language
     stays filtered after switching to the other. */
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("any");
  const [stock, setStock] = useState("any");
  const [sort, setSort] = useState<string>(PRODUCT_SORTS[0]);
  const [page, setPage] = useState(1);

  const [target, setTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    api.products
      .list()
      .then((response) => {
        if (!cancelled) setProducts(response.data);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : t("filters.couldNotLoadCatalogue"));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [t]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();

    const matched = products.filter((product) => {
      if (term && !`${product.name} ${product.slug}`.toLowerCase().includes(term)) return false;
      if (category !== "all" && product.category !== category) return false;
      if (status === "live" && !product.isActive) return false;
      if (status === "draft" && product.isActive) return false;
      if (stock === "in" && product.stock <= LOW_STOCK) return false;
      if (stock === "low" && !(product.stock > 0 && product.stock <= LOW_STOCK)) return false;
      if (stock === "out" && product.stock !== 0) return false;
      return true;
    });

    const byDate = (value?: string) => (value ? new Date(value).getTime() : 0);

    switch (sort) {
      case "oldest":
        return matched.sort((a, b) => byDate(a.createdAt) - byDate(b.createdAt));
      case "nameAsc":
        /* Collated for the active locale, so Georgian names sort by the
           Georgian alphabet rather than by code point. */
        return matched.sort((a, b) => a.name.localeCompare(b.name, locale));
      case "priceDesc":
        return matched.sort((a, b) => b.price - a.price);
      case "priceAsc":
        return matched.sort((a, b) => a.price - b.price);
      case "stockAsc":
        return matched.sort((a, b) => a.stock - b.stock);
      case "topRated":
        return matched.sort((a, b) => b.rating - a.rating);
      default:
        return matched.sort((a, b) => byDate(b.createdAt) - byDate(a.createdAt));
    }
  }, [products, search, category, status, stock, sort, locale]);

  const pages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const rows = visible.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  /* Any change to what is being filtered starts again from the first page. */
  const narrow = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPage(1);
  };

  const onDelete = async () => {
    if (!target) return;

    setDeleting(true);

    try {
      await api.products.remove(target._id);
      setProducts((current) => current.filter((product) => product._id !== target._id));
      setTarget(null);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : t("filters.couldNotDeleteProduct"));
    } finally {
      setDeleting(false);
    }
  };

  const lowStock = products.filter((product) => product.stock > 0 && product.stock <= LOW_STOCK).length;
  const outOfStock = products.filter((product) => product.stock === 0).length;

  const editable = config.can.edit || config.can.remove;

  return (
    <div className="space-y-8">
      <ConsoleHeader
        breadcrumb={[
          { label: t("breadcrumb.console"), href: config.base },
          { label: t("breadcrumb.products") },
        ]}
        title={t("products.title")}
        description={
          loading
            ? t("products.loading")
            : t("filters.productsSummary", {
                total: formatCount(products.length),
                low: formatCount(lowStock),
                out: formatCount(outOfStock),
              })
        }
        actions={
          <ButtonLink href={`${config.base}/products/new`}>
            <Plus className="size-4" strokeWidth={2} aria-hidden />
            {t("products.newProduct")}
          </ButtonLink>
        }
      />

      {!config.can.edit && (
        <ReadOnlyNotice>{t("products.readOnly")}</ReadOnlyNotice>
      )}

      {error && (
        <p className="flex items-start gap-2.5 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          <AlertCircle className="mt-px size-4 shrink-0" strokeWidth={1.75} aria-hidden />
          {error}
        </p>
      )}

      <div className="rounded-lg border border-line bg-canvas">
        <Toolbar
          searchPlaceholder={t("filters.searchProducts")}
          search={search}
          onSearchChange={narrow(setSearch)}
          filters={[
            {
              id: "filter-category",
              label: t("filters.category"),
              options: [
                { value: "all", label: t("filters.allCategories") },
                ...CATEGORIES.map((slug) => ({ value: slug, label: tCat(`${slug}.name`) })),
              ],
              value: category,
              onChange: narrow(setCategory),
            },
            {
              id: "filter-status",
              label: t("filters.status"),
              options: [
                { value: "any", label: t("filters.anyStatus") },
                { value: "live", label: t("pills.live") },
                { value: "draft", label: t("pills.draft") },
              ],
              value: status,
              onChange: narrow(setStatus),
            },
            {
              id: "filter-stock",
              label: t("filters.stock"),
              options: [
                { value: "any", label: t("filters.anyStock") },
                { value: "in", label: t("filters.inStock") },
                { value: "low", label: t("filters.lowStock") },
                { value: "out", label: t("filters.outOfStock") },
              ],
              value: stock,
              onChange: narrow(setStock),
            },
            {
              id: "filter-sort",
              label: t("filters.sort"),
              options: PRODUCT_SORTS.map((key) => ({ value: key, label: t(`sorts.${key}`) })),
              value: sort,
              onChange: narrow(setSort),
            },
          ]}
          meta={
            loading
              ? t("overview.loading")
              : t("filters.productsMeta", {
                  shown: formatCount(rows.length),
                  total: formatCount(visible.length),
                })
          }
        />

        {loading ? (
          <p className="flex items-center justify-center gap-2.5 px-4 py-16 text-sm text-ink-muted">
            <Loader2 className="size-4 animate-spin" strokeWidth={1.75} aria-hidden />
            {t("products.loading")}
          </p>
        ) : rows.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={<Package className="size-6" strokeWidth={1.5} aria-hidden />}
              title={
                products.length === 0
                  ? t("filters.noProductsYet")
                  : t("filters.noMatch")
              }
              description={
                products.length === 0 ? t("empty.addFirstProduct") : t("empty.widenFilters")
              }
              actions={
                products.length === 0 ? (
                  <ButtonLink href={`${config.base}/products/new`}>
                    {t("products.newProduct")}
                  </ButtonLink>
                ) : undefined
              }
              className="border-0 bg-transparent"
            />
          </div>
        ) : (
          <>
            <Table
              head={
                <>
                  <Th>{t("table.product")}</Th>
                  <Th>{t("table.category")}</Th>
                  <Th align="right">{t("table.price")}</Th>
                  <Th align="right">{t("table.stock")}</Th>
                  <Th>{t("table.status")}</Th>
                  <Th>{t("table.updated")}</Th>
                  <Th align="right">{editable ? t("table.actions") : t("table.view")}</Th>
                </>
              }
            >
              {rows.map((product) => (
                <Tr key={product._id}>
                  <Td>
                    <span className="flex items-center gap-3">
                      <Thumb src={product.image} alt="" />
                      <span className="min-w-0">
                        {config.can.edit ? (
                          <Link
                            href={`${config.base}/products/${product._id}`}
                            className="block truncate font-medium text-ink transition-colors hover:text-accent"
                          >
                            {product.name}
                          </Link>
                        ) : (
                          <span className="block truncate font-medium text-ink">{product.name}</span>
                        )}
                        <span className="block truncate text-xs text-ink-subtle">
                          /{product.slug}
                        </span>
                      </span>
                    </span>
                  </Td>

                  <Td>{tCat(`${product.category}.name`)}</Td>

                  <Td align="right">
                    <span className="tabular-nums text-ink">{formatMoney(product.price)}</span>
                    {product.previousPrice ? (
                      <span className="ml-2 text-xs tabular-nums text-ink-subtle line-through">
                        {formatMoney(product.previousPrice)}
                      </span>
                    ) : null}
                  </Td>

                  <Td align="right">
                    <StockPill stock={product.stock} />
                  </Td>

                  <Td>
                    <StatusPill active={product.isActive} />
                  </Td>

                  <Td>
                    <span className="whitespace-nowrap text-xs text-ink-subtle">
                      {dates.short(product.updatedAt)}
                    </span>
                  </Td>

                  <Td align="right">
                    {editable ? (
                      <span className="flex items-center justify-end gap-1">
                        {config.can.edit && (
                          <Link
                            href={`${config.base}/products/${product._id}`}
                            aria-label={t("table.editNamed", { name: product.name })}
                            className={iconButton}
                          >
                            <Pencil className="size-4" strokeWidth={1.75} aria-hidden />
                          </Link>
                        )}
                        {config.can.remove && (
                          <button
                            type="button"
                            onClick={() => setTarget(product)}
                            aria-label={t("table.deleteNamed", { name: product.name })}
                            className={`${iconButton} hover:bg-danger/10 hover:text-danger`}
                          >
                            <Trash2 className="size-4" strokeWidth={1.75} aria-hidden />
                          </button>
                        )}
                      </span>
                    ) : (
                      <Link
                        href={`/product/${product.slug}`}
                        aria-label={t("table.viewNamed", { name: product.name })}
                        className={`${iconButton} ml-auto`}
                      >
                        <ArrowUpRight className="size-4" strokeWidth={1.75} aria-hidden />
                      </Link>
                    )}
                  </Td>
                </Tr>
              ))}
            </Table>

            <Pager page={current} pages={pages} onChange={setPage} />
          </>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(target)}
        title={t("products.confirmDeleteTitle")}
        body={t("products.confirmDeleteBody", { name: target?.name ?? "" })}
        confirmLabel={t("products.confirmDeleteAction")}
        busy={deleting}
        onConfirm={onDelete}
        onCancel={() => setTarget(null)}
      />
    </div>
  );
}
