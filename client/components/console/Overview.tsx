"use client";

import { useEffect, useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { AlertCircle, Boxes, Loader2, Package, ShieldCheck, Users } from "lucide-react";
import { ActivityChart, CategoryBars } from "@/components/console/Charts";
import Panel from "@/components/console/Panel";
import { RolePill, StatusPill, StockPill } from "@/components/console/Pills";
import StatCard from "@/components/console/StatCard";
import { Table, Td, Th, Thumb, Tr } from "@/components/console/Table";
import { api, type Product, type User } from "@/lib/api";
import { useUser } from "@/context/UserContext";
import { initialsOf, type ConsoleConfig } from "@/lib/console";
import { useCounts, useDates } from "@/lib/format";


/** The last six calendar months, oldest first, as {date, products, users}. */
function monthsOfActivity(products: Product[], users: User[]) {
  const now = new Date();

  const buckets = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      date,
      products: 0,
      users: 0,
    };
  });

  const index = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  const count = (value: string | undefined, field: "products" | "users") => {
    if (!value) return;

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return;

    const bucket = index.get(`${date.getFullYear()}-${date.getMonth()}`);
    if (bucket) bucket[field] += 1;
  };

  for (const product of products) count(product.createdAt, "products");
  for (const user of users) count(user.createdAt, "users");

  return buckets.map(({ date, products: added, users: joined }) => ({
    date,
    products: added,
    users: joined,
  }));
}

/**
 * The landing screen for both consoles.
 *
 * Every figure on it is read from the API — the catalogue from /products and,
 * where the console is allowed the roster, the accounts from /users. A piece
 * added in either console shows up in the numbers straight away.
 *
 * There is no revenue or orders figure because this store has no order model;
 * a number with nothing behind it would be worse than its absence.
 */
export default function Overview({ config }: { config: ConsoleConfig }) {
  const t = useTranslations("console");
  const tCat = useTranslations("categories");
  const { count: formatCount, money: formatMoney } = useCounts();
  const dates = useDates();
  const { users: roster, getUsers } = useUser();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* Only the console that has an accounts screen reads the roster. The
     moderator console adds products and nothing else, so asking for the list
     of accounts there would be requesting something it may not show. */
  const showsAccounts = config.can.viewUsers;

  useEffect(() => {
    if (showsAccounts) void getUsers();
  }, [showsAccounts, getUsers]);

  const users = useMemo(() => roster ?? [], [roster]);

  useEffect(() => {
    let cancelled = false;

    api.products
      .list()
      .then((response) => {
        if (!cancelled) setProducts(response.data);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Could not load the catalogue");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const catalogue = useMemo(() => {
    const units = products.reduce((sum, product) => sum + product.stock, 0);
    const value = products.reduce((sum, product) => sum + product.stock * product.price, 0);
    const byDate = (product: Product) =>
      product.createdAt ? new Date(product.createdAt).getTime() : 0;

    const byCategory = Object.entries(
      products.reduce<Record<string, number>>((groups, product) => {
        groups[product.category] = (groups[product.category] ?? 0) + 1;
        return groups;
      }, {}),
    )
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    return {
      total: products.length,
      active: products.filter((product) => product.isActive).length,
      draft: products.filter((product) => !product.isActive).length,
      units,
      value,
      byCategory,
      lowStock: [...products].sort((a, b) => a.stock - b.stock).slice(0, 5),
      recent: [...products].sort((a, b) => byDate(b) - byDate(a)).slice(0, 6),
    };
  }, [products]);

  const accounts = useMemo(() => {
    const staff = users.filter((row) => row.role !== "user").length;
    const byDate = (value?: string) => (value ? new Date(value).getTime() : 0);

    return {
      total: users.length,
      staff,
      customers: users.length - staff,
      verified: users.filter((row) => row.isVerifed).length,
      recent: [...users].sort((a, b) => byDate(b.createdAt) - byDate(a.createdAt)).slice(0, 5),
    };
  }, [users]);

  const activity = useMemo(() => monthsOfActivity(products, users), [products, users]);

  return (
    <div className="space-y-6">
      {error && (
        <p className="flex items-start gap-2.5 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          <AlertCircle className="mt-px size-4 shrink-0" strokeWidth={1.75} aria-hidden />
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("overview.products")}
          value={loading ? "—" : formatCount(catalogue.total)}
          icon={Package}
          hint={t("overview.liveDraft", { live: catalogue.active, draft: catalogue.draft })}
        />
        <StatCard
          label={t("overview.inventoryValue")}
          value={loading ? "—" : formatMoney(catalogue.value)}
          icon={Boxes}
          hint={t("overview.unitsOnHand", { count: formatCount(catalogue.units) })}
        />
        <StatCard
          label={t("overview.accounts")}
          value={showsAccounts ? formatCount(accounts.total) : "—"}
          icon={Users}
          hint={
            showsAccounts
              ? t("overview.customersStaff", {
                  customers: formatCount(accounts.customers),
                  staff: formatCount(accounts.staff),
                })
              : t("overview.adminOnly")
          }
        />
        <StatCard
          label={t("overview.verified")}
          value={showsAccounts ? formatCount(accounts.verified) : "—"}
          icon={ShieldCheck}
          hint={
            showsAccounts
              ? t("overview.stillToConfirm", {
                  count: formatCount(accounts.total - accounts.verified),
                })
              : t("overview.adminOnly")
          }
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel
          title={t("overview.lastSixMonths")}
          description={
            showsAccounts ? t("overview.activityBoth") : t("overview.activityProducts")
          }
        >
          {loading ? <Waiting /> : <ActivityChart data={activity} showUsers={showsAccounts} />}
        </Panel>

        <Panel title={t("overview.catalogueMix")} description={t("overview.catalogueMixHint")}>
          {loading ? (
            <Waiting />
          ) : (
            <CategoryBars data={catalogue.byCategory} />
          )}
        </Panel>
      </div>

      {/* One column when the accounts panel is not drawn, so the low-stock
          table fills the row instead of stranding a gap beside itself. */}
      <div
        className={
          showsAccounts
            ? "grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]"
            : "grid gap-6"
        }
      >
        <Panel
          title={t("overview.runningLow")}
          description={t("overview.runningLowHint")}
          action={{ label: t("overview.allProducts"), href: `${config.base}/products` }}
          flush
        >
          {loading ? (
            <div className="px-5 py-5">
              <Waiting />
            </div>
          ) : (
            <Table
              head={
                <>
                  <Th>{t("table.product")}</Th>
                  <Th>{t("table.category")}</Th>
                  <Th align="right">{t("table.price")}</Th>
                  <Th align="right">{t("table.stock")}</Th>
                </>
              }
            >
              {catalogue.lowStock.map((product) => (
                <Tr key={product._id}>
                  <Td>
                    <span className="flex items-center gap-3">
                      <Thumb src={product.image} alt="" />
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-ink">{product.name}</span>
                        <span className="block truncate text-xs text-ink-subtle">
                          /{product.slug}
                        </span>
                      </span>
                    </span>
                  </Td>
                  <Td>{tCat(`${product.category}.name`)}</Td>
                  <Td align="right">
                    <span className="tabular-nums text-ink">{formatMoney(product.price)}</span>
                  </Td>
                  <Td align="right">
                    <StockPill stock={product.stock} />
                  </Td>
                </Tr>
              ))}
            </Table>
          )}
        </Panel>

        {showsAccounts && (
          <Panel
            title={t("overview.newestAccounts")}
            description={t("overview.newestAccountsHint")}
            action={{ label: t("overview.allUsers"), href: `${config.base}/users` }}
          >
            {accounts.recent.length === 0 ? (
              <p className="py-6 text-center text-sm text-ink-muted">{t("overview.noAccounts")}</p>
            ) : (
              <ul className="space-y-4">
                {accounts.recent.map((row) => (
                  <li key={row._id} className="flex items-center gap-3">
                    <span
                      aria-hidden
                      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-strong text-xs font-medium text-ink"
                    >
                      {initialsOf(row.fullname)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-ink">{row.fullname}</span>
                      <span className="block truncate text-xs text-ink-subtle">{row.email}</span>
                    </span>
                    <RolePill role={row.role} />
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        )}
      </div>

      <Panel
        title={t("overview.recentlyAdded")}
        description={t("overview.recentlyAddedHint")}
        action={{ label: t("overview.allProducts"), href: `${config.base}/products` }}
        flush
      >
        {loading ? (
          <div className="px-5 py-5">
            <Waiting />
          </div>
        ) : (
          <Table
            head={
              <>
                <Th>{t("table.product")}</Th>
                <Th>{t("table.category")}</Th>
                <Th align="right">{t("table.price")}</Th>
                <Th align="right">{t("table.stock")}</Th>
                <Th>{t("table.status")}</Th>
                <Th>{t("table.added")}</Th>
              </>
            }
          >
            {catalogue.recent.map((product) => (
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
                      <span className="block truncate text-xs text-ink-subtle">/{product.slug}</span>
                    </span>
                  </span>
                </Td>
                <Td>{tCat(`${product.category}.name`)}</Td>
                <Td align="right">
                  <span className="tabular-nums text-ink">{formatMoney(product.price)}</span>
                </Td>
                <Td align="right">
                  <StockPill stock={product.stock} />
                </Td>
                <Td>
                  <StatusPill active={product.isActive} />
                </Td>
                <Td>
                  <span className="whitespace-nowrap text-xs text-ink-subtle">
                    {dates.short(product.createdAt)}
                  </span>
                </Td>
              </Tr>
            ))}
          </Table>
        )}
      </Panel>
    </div>
  );
}

function Waiting() {
  const t = useTranslations("console.overview");

  return (
    <p className="flex items-center justify-center gap-2.5 py-10 text-sm text-ink-muted">
      <Loader2 className="size-4 animate-spin" strokeWidth={1.75} aria-hidden />
      {t("loading")}
    </p>
  );
}
