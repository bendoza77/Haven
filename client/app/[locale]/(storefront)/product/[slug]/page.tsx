import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { RotateCcw, ShieldCheck, Truck } from "lucide-react";
import ProductGallery from "@/components/product/ProductGallery";
import ProductGrid from "@/components/product/ProductGrid";
import ProductPurchase from "@/components/product/ProductPurchase";
import ProductReviews from "@/components/product/ProductReviews";
import Badge from "@/components/ui/Badge";
import Breadcrumb from "@/components/ui/Breadcrumb";
import Container from "@/components/ui/Container";
import Disclosure from "@/components/ui/Disclosure";
import Price from "@/components/ui/Price";
import Rating from "@/components/ui/Rating";
import SectionHeader from "@/components/ui/SectionHeader";
import { getCategory } from "@/data/catalog";
import { getProduct, getRelatedProducts } from "@/lib/products";

const badgeTones = { New: "new", Sale: "sale", Bestseller: "bestseller" } as const;

/* Icon plus message key: the wording is translated, the pairing is not. */
const assurances = [
  { icon: Truck, key: "delivery" },
  { icon: RotateCcw, key: "returns" },
  { icon: ShieldCheck, key: "guarantee" },
] as const;

/* No generateStaticParams: the catalogue is a database the consoles write to,
   so the set of product pages is not known at build time. */

export async function generateMetadata(props: PageProps<"/[locale]/product/[slug]">) {
  const { slug } = await props.params;
  const product = await getProduct(slug);
  if (!product) return {};

  return { title: product.name, description: product.description };
}

export default async function ProductPage(props: PageProps<"/[locale]/product/[slug]">) {
  const { slug } = await props.params;
  const product = await getProduct(slug);

  if (!product) notFound();

  const t = await getTranslations("product");
  const tCat = await getTranslations("categories");
  const tBreadcrumb = await getTranslations("breadcrumb");

  const category = getCategory(product.category);
  const related = await getRelatedProducts(product);
  const categoryName = category ? tCat(`${category.slug}.name`) : undefined;

  return (
    <>
      <Container className="py-6 lg:py-10">
        <Breadcrumb
          items={[
            { label: tBreadcrumb("home"), href: "/" },
            { label: tBreadcrumb("shop"), href: "/shop" },
            ...(category && categoryName
              ? [{ label: categoryName, href: `/category/${category.slug}` }]
              : []),
            { label: product.name },
          ]}
        />

        <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-16">
          <ProductGallery images={product.images} name={product.name} />

          <div className="lg:sticky lg:top-28 lg:self-start">
            <div className="flex items-center gap-3">
              {category && (
                <Link
                  href={`/category/${category.slug}`}
                  className="text-xs uppercase tracking-[0.14em] text-ink-subtle transition-colors hover:text-ink"
                >
                  {categoryName}
                </Link>
              )}
              {product.badge && (
                <Badge tone={badgeTones[product.badge]}>
                  {t(`badge.${product.badge.toLowerCase()}`)}
                </Badge>
              )}
            </div>

            <h1 className="mt-4 font-display text-4xl leading-tight tracking-tight text-ink sm:text-5xl">
              {product.name}
            </h1>

            <div className="mt-4">
              <Rating value={product.rating} reviewCount={product.reviewCount} />
            </div>

            <Price
              price={product.price}
              previousPrice={product.previousPrice}
              size="lg"
              showDiscount
              className="mt-5"
            />
            <p className="mt-1 text-xs text-ink-subtle">{t("taxNote")}</p>

            <p className="mt-6 text-base leading-relaxed text-ink-muted">{product.description}</p>

            <ProductPurchase product={product} />

            <ul className="mt-8 space-y-3 border-t border-line pt-8">
              {assurances.map(({ icon: Icon, key }) => (
                <li key={key} className="flex items-center gap-3 text-sm text-ink-muted">
                  <Icon className="size-4 shrink-0 text-ink" strokeWidth={1.5} aria-hidden />
                  {t(`assurances.${key}`)}
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <Disclosure title={t("detailsTitle")} defaultOpen>
                <ul className="space-y-2">
                  {product.details.map((detail) => (
                    <li key={detail} className="flex gap-2.5">
                      <span className="mt-2 size-1 shrink-0 rounded-full bg-line-strong" aria-hidden />
                      {detail}
                    </li>
                  ))}
                </ul>
              </Disclosure>
              <Disclosure title={t("shippingTitle")}>
                <p>{t("shippingBody")}</p>
              </Disclosure>
              <Disclosure title={t("returnsTitle")}>
                <p>{t("returnsBody")}</p>
              </Disclosure>
              <Disclosure title={t("careTitle")}>
                <p>{t("careBody")}</p>
              </Disclosure>
            </div>
          </div>
        </div>
      </Container>

      <section id="reviews" className="border-t border-line py-16 lg:py-24">
        <Container>
          <ProductReviews slug={product.slug} productName={product.name} />
        </Container>
      </section>

      {related.length > 0 && (
        <section className="border-t border-line py-16 lg:py-24">
          <Container>
            <SectionHeader
              eyebrow={t("relatedEyebrow")}
              title={
                categoryName
                  ? t("moreFrom", { category: categoryName })
                  : t("relatedProducts")
              }
              action={
                category
                  ? { label: t("viewCategory"), href: `/category/${category.slug}` }
                  : undefined
              }
            />
            <ProductGrid products={related} className="mt-10 lg:mt-12" />
          </Container>
        </section>
      )}
    </>
  );
}
