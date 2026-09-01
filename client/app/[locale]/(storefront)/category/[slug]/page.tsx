import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { pageMetadata } from "@/lib/seo";
import ProductBrowser from "@/components/product/ProductBrowser";
import PageHeader from "@/components/ui/PageHeader";
import { categories, getCategory } from "@/data/catalog";
import { getProductsByCategory } from "@/lib/products";
import { isSortValue } from "@/lib/shop";

export function generateStaticParams() {
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata(props: PageProps<"/[locale]/category/[slug]">) {
  const { locale, slug } = await props.params;
  const category = getCategory(slug);
  if (!category) return {};

  const t = await getTranslations({ locale, namespace: "categories" });

  return pageMetadata({
    locale,
    path: `/category/${slug}`,
    title: t(`${slug}.name`),
    description: t(`${slug}.description`),
    images: [category.image],
  });
}

export default async function CategoryPage(props: PageProps<"/[locale]/category/[slug]">) {
  const { slug } = await props.params;
  const params = await props.searchParams;
  const category = getCategory(slug);

  if (!category) notFound();

  const t = await getTranslations("categories");
  const tBreadcrumb = await getTranslations("breadcrumb");
  const tCounts = await getTranslations("counts");

  const first = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const onSale = first("filter") === "sale";
  const sortParam = first("sort");
  const sort = isSortValue(sortParam) ? sortParam : "featured";
  const page = Number(first("page")) || 1;

  const all = await getProductsByCategory(category.slug);
  const visible = onSale ? all.filter((product) => product.previousPrice !== undefined) : all;

  const name = t(`${category.slug}.name`);

  return (
    <>
      <PageHeader
        breadcrumb={[
          { label: tBreadcrumb("home"), href: "/" },
          { label: tBreadcrumb("categories"), href: "/categories" },
          { label: name },
        ]}
        title={name}
        description={t(`${category.slug}.description`)}
        meta={tCounts("products", { count: visible.length })}
      />

      <ProductBrowser
        basePath={`/category/${category.slug}`}
        products={visible}
        activeCategory={category.slug}
        onSale={onSale}
        sort={sort}
        page={page}
      />
    </>
  );
}
