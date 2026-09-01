import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { pageMetadata } from "@/lib/seo";
import { ArrowRight } from "lucide-react";
import CategoryCard from "@/components/category/CategoryCard";
import Container from "@/components/ui/Container";
import PageHeader from "@/components/ui/PageHeader";
import { categories } from "@/data/catalog";
import { countByCategory } from "@/lib/products";

export async function generateMetadata(
  props: PageProps<"/[locale]/categories">,
): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "categoriesPage" });

  return pageMetadata({
    locale,
    path: "/categories",
    title: t("title"),
    description: t("metaDescription"),
  });
}

export default async function CategoriesPage({ params }: PageProps<"/[locale]/categories">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("categoriesPage");
  const tBreadcrumb = await getTranslations("breadcrumb");

  const counts = await countByCategory();

  return (
    <>
      <PageHeader
        breadcrumb={[
          { label: tBreadcrumb("home"), href: "/" },
          { label: tBreadcrumb("categories") },
        ]}
        title={t("title")}
        description={t("description")}
        meta={t("meta", { count: categories.length })}
      />

      <Container className="py-10 lg:py-14">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category, index) => (
            <CategoryCard
              key={category.slug}
              category={category}
              productCount={counts[category.slug] ?? 0}
              priority={index < 3}
            />
          ))}

          <Link
            href="/shop"
            className="group flex min-h-56 flex-col justify-between rounded-lg border border-line bg-surface p-6 transition-colors hover:border-line-strong hover:bg-surface-strong"
          >
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-ink-subtle">
                {t("notSureEyebrow")}
              </p>
              <h2 className="mt-2 font-display text-2xl tracking-tight text-ink">
                {t("notSureTitle")}
              </h2>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink-muted">
                {t("notSureBody")}
              </p>
            </div>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-ink">
              {t("notSureCta")}
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </span>
          </Link>
        </div>
      </Container>
    </>
  );
}
