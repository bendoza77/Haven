import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { Search, SearchX } from "lucide-react";
import ProductGrid from "@/components/product/ProductGrid";
import { ButtonLink } from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import EmptyState from "@/components/ui/EmptyState";
import SectionHeader from "@/components/ui/SectionHeader";
import { getCollection, searchProducts } from "@/lib/products";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("search");
  return { title: t("title"), description: t("metaDescription") };
}

/* The chips are translated, but the query they run stays English: the product
   catalogue in MongoDB is written in English, so a Georgian chip that searched
   for its own label would return nothing. Label and query are separate. */
const suggestions = [
  { key: "sofa", query: "sofa" },
  { key: "pendant", query: "pendant" },
  { key: "linen", query: "linen" },
  { key: "leather", query: "leather" },
  { key: "headphones", query: "headphones" },
  { key: "vase", query: "vase" },
  { key: "jacket", query: "jacket" },
] as const;

export default async function SearchPage(props: PageProps<"/[locale]/search">) {
  const t = await getTranslations("search");

  const params = await props.searchParams;
  const raw = params.q;
  const query = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? "";
  const results = await searchProducts(query);
  const popular = query === "" ? await getCollection("popular", 4) : [];

  return (
    <>
      <div className="border-b border-line bg-surface">
        <Container>
          <div className="mx-auto max-w-2xl py-12 text-center lg:py-16">
            <h1 className="font-display text-4xl leading-tight tracking-tight text-ink sm:text-5xl">
              {t("title")}
            </h1>
            <p className="mt-3 text-base text-ink-muted">{t("subtitle")}</p>

            <form action="/search" role="search" className="relative mt-8">
              <label htmlFor="search-input" className="sr-only">
                {t("inputLabel")}
              </label>
              <Search
                className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ink-subtle"
                aria-hidden
              />
              <input
                id="search-input"
                name="q"
                type="search"
                defaultValue={query}
                placeholder={t("placeholder")}
                className="h-13 w-full rounded-md border border-line-strong bg-canvas pl-12 pr-28 text-base text-ink placeholder:text-ink-subtle focus:border-ink focus:outline-none"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 h-10 rounded-md bg-ink px-5 text-sm font-medium text-canvas transition-colors hover:bg-ink/90"
              >
                {t("submit")}
              </button>
            </form>

            <ul className="mt-5 flex flex-wrap justify-center gap-2">
              {suggestions.map((suggestion) => (
                <li key={suggestion.key}>
                  <Link
                    href={`/search?q=${suggestion.query}`}
                    className="inline-flex rounded-full border border-line bg-canvas px-3.5 py-1.5 text-xs text-ink-muted transition-colors hover:border-ink hover:text-ink"
                  >
                    {t(`suggestions.${suggestion.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </div>

      <Container className="py-10 lg:py-14">
        {query === "" ? (
          <section>
            <SectionHeader
              eyebrow={t("popularEyebrow")}
              title={t("popularTitle")}
              action={{ label: t("popularAction"), href: "/shop" }}
            />
            <ProductGrid products={popular} className="mt-10" />
          </section>
        ) : results.length > 0 ? (
          <section>
            <h2 className="text-sm text-ink-muted">
              {t("resultsFor", { count: results.length, query })}
            </h2>
            <ProductGrid products={results} priorityCount={4} className="mt-8" />
          </section>
        ) : (
          <EmptyState
            icon={<SearchX className="size-6" aria-hidden />}
            title={t("noResultsTitle", { query })}
            description={t("noResultsBody")}
            actions={
              <>
                <ButtonLink href="/shop">{t("browseAll")}</ButtonLink>
                <ButtonLink href="/categories" variant="secondary">
                  {t("shopByCategory")}
                </ButtonLink>
              </>
            }
          />
        )}
      </Container>
    </>
  );
}
