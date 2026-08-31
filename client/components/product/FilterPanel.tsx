import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { categories } from "@/data/catalog";
import { buildQuery } from "@/lib/shop";
import { cn } from "@/lib/utils";

/* Keys rather than labels: the price bands are written differently in each
   language, and the swatch names are colour words, not product codes. */
const priceRanges = ["under100", "100to250", "250to500", "500to1000", "over1000"] as const;

const swatches = [
  { key: "ink", hex: "#191512" },
  { key: "chalk", hex: "#efe9e0" },
  { key: "sand", hex: "#d8cdbd" },
  { key: "clay", hex: "#9d4b24" },
  { key: "forest", hex: "#2f4f3f" },
  { key: "ochre", hex: "#c98a2b" },
] as const;

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-line py-6 first:border-t-0 first:pt-0">
      <h3 className="mb-4 text-xs font-medium uppercase tracking-[0.16em] text-ink">{title}</h3>
      {children}
    </div>
  );
}

function OptionLink({
  href,
  isActive,
  children,
}: {
  href: string;
  isActive: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={isActive ? "true" : undefined}
      className={cn(
        "block rounded-sm py-1.5 text-sm transition-colors",
        isActive ? "font-medium text-ink" : "text-ink-muted hover:text-ink",
      )}
    >
      {children}
    </Link>
  );
}

/**
 * Category and sale links drive the URL; price, colour and rating are
 * presentation-only controls that shape the visual design.
 */
export default function FilterPanel({
  basePath,
  activeCategory,
  onSale,
  sort,
}: {
  basePath: string;
  activeCategory?: string;
  onSale?: boolean;
  sort?: string;
}) {
  const t = useTranslations("filters");
  const tCat = useTranslations("categories");

  const filter = onSale ? "sale" : undefined;

  return (
    <div>
      <Group title={t("category")}>
        <ul className="space-y-1">
          <li>
            <OptionLink
              href={buildQuery("/shop", { filter, sort })}
              isActive={activeCategory === undefined}
            >
              {t("allProducts")}
            </OptionLink>
          </li>
          {categories.map((category) => (
            <li key={category.slug}>
              <OptionLink
                href={buildQuery(`/category/${category.slug}`, { filter, sort })}
                isActive={activeCategory === category.slug}
              >
                {tCat(`${category.slug}.name`)}
              </OptionLink>
            </li>
          ))}
        </ul>
      </Group>

      <Group title={t("availability")}>
        <ul className="space-y-1">
          <li>
            <OptionLink href={buildQuery(basePath, { sort })} isActive={!onSale}>
              {t("everything")}
            </OptionLink>
          </li>
          <li>
            <OptionLink
              href={buildQuery(basePath, { filter: "sale", sort })}
              isActive={Boolean(onSale)}
            >
              {t("onSaleOnly")}
            </OptionLink>
          </li>
        </ul>
      </Group>

      <Group title={t("price")}>
        <ul className="space-y-2.5">
          {priceRanges.map((range) => (
            <li key={range}>
              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-muted">
                <input type="checkbox" className="size-4 rounded-sm accent-ink" />
                {t(`priceRanges.${range}`)}
              </label>
            </li>
          ))}
        </ul>
      </Group>

      <Group title={t("colour")}>
        <ul className="flex flex-wrap gap-2.5">
          {swatches.map((swatch) => (
            <li key={swatch.key}>
              <button
                type="button"
                aria-label={t(`swatches.${swatch.key}`)}
                title={t(`swatches.${swatch.key}`)}
                style={{ backgroundColor: swatch.hex }}
                className="size-8 rounded-full ring-1 ring-inset ring-ink/10 transition-transform hover:scale-110"
              />
            </li>
          ))}
        </ul>
      </Group>

      <Group title={t("rating")}>
        <ul className="space-y-2.5">
          {[4.5, 4.0, 3.5].map((rating) => (
            <li key={rating}>
              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-muted">
                <input type="checkbox" className="size-4 rounded-sm accent-ink" />
                {t("ratingAndAbove", { rating: rating.toFixed(1) })}
              </label>
            </li>
          ))}
        </ul>
      </Group>
    </div>
  );
}
