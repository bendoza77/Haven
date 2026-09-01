import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { pageMetadata } from "@/lib/seo";
import ProductBrowser from "@/components/product/ProductBrowser";
import PageHeader from "@/components/ui/PageHeader";
import { fetchLiveProducts } from "@/lib/products";
import { isSortValue } from "@/lib/shop";

export async function generateMetadata(props: PageProps<"/[locale]/shop">): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "shop" });

  /* The bare /shop is the canonical one. A sorted, filtered or paginated view
     of the same grid is the same page seen through a query string, and letting
     each of those claim its own address is how a catalogue ends up competing
     with itself for its own terms. */
  return pageMetadata({
    locale,
    path: "/shop",
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

export default async function ShopPage(props: PageProps<"/[locale]/shop">) {
  const t = await getTranslations("shop");
  const tBreadcrumb = await getTranslations("breadcrumb");
  const tCounts = await getTranslations("counts");

  const params = await props.searchParams;
  const first = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const onSale = first("filter") === "sale";
  const sortParam = first("sort");
  const sort = isSortValue(sortParam) ? sortParam : "featured";
  const page = Number(first("page")) || 1;

  const products = await fetchLiveProducts();

  const visible = onSale
    ? products.filter((product) => product.previousPrice !== undefined)
    : products;

  return (
    <>
      <PageHeader
        breadcrumb={[
          { label: tBreadcrumb("home"), href: "/" },
          { label: tBreadcrumb("shop") },
        ]}
        title={onSale ? t("saleTitle") : t("allTitle")}
        description={onSale ? t("saleDescription") : t("allDescription")}
        meta={tCounts("products", { count: visible.length })}
      />

      <ProductBrowser
        basePath="/shop"
        products={visible}
        onSale={onSale}
        sort={sort}
        page={page}
      />
    </>
  );
}
