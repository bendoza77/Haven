import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { absoluteUrl, pageMetadata } from "@/lib/seo";
import { siteUrl } from "@/lib/site";
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
import type { Product } from "@/lib/api";
import {
  fetchLiveProducts,
  fetchReviews,
  getProduct,
  getRelatedProducts,
} from "@/lib/products";

const badgeTones = { New: "new", Sale: "sale", Bestseller: "bestseller" } as const;

/* Icon plus message key: the wording is translated, the pairing is not. */
const assurances = [
  { icon: Truck, key: "delivery" },
  { icon: RotateCcw, key: "returns" },
  { icon: ShieldCheck, key: "guarantee" },
] as const;

/**
 * Every product that existed at build time, in both languages.
 *
 * The catalogue is a database the consoles write to, so this list is a
 * snapshot rather than the whole truth — which is exactly what
 * `dynamicParams` (on by default) is for: a product added after the build
 * renders on its first request and is cached from then on. What the snapshot
 * buys is that the pages a crawler and a shopper actually reach are already
 * built, served from the edge, and revalidated by the tag the consoles purge
 * — instead of every product page being rendered on demand, every time, which
 * is what the route was doing.
 *
 * An unreachable API yields an empty list and every page falls back to being
 * built on request. That is the old behaviour, so a build never fails over it.
 */
export async function generateStaticParams() {
  const products = await fetchLiveProducts();
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata(props: PageProps<"/[locale]/product/[slug]">) {
  const { locale, slug } = await props.params;
  const product = await getProduct(slug);
  if (!product) return {};

  return pageMetadata({
    locale,
    path: `/product/${slug}`,
    title: product.name,
    description: product.description,
    images: product.image ? [product.image] : undefined,
    type: "article",
  });
}

export default async function ProductPage(props: PageProps<"/[locale]/product/[slug]">) {
  const { locale, slug } = await props.params;
  setRequestLocale(locale);

  const product = await getProduct(slug);

  if (!product) notFound();

  const t = await getTranslations("product");
  const tCat = await getTranslations("categories");
  const tBreadcrumb = await getTranslations("breadcrumb");

  const category = getCategory(product.category);

  /* Both read from the same cached catalogue, so asking for them together
     costs one round trip rather than two in series. */
  const [related, reviews] = await Promise.all([
    getRelatedProducts(product),
    fetchReviews(slug),
  ]);
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
          <ProductReviews
            slug={product.slug}
            productName={product.name}
            initialReviews={reviews}
          />
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

      <ProductStructuredData locale={locale} product={product} reviewCount={reviews.length} />
    </>
  );
}

/**
 * The piece, described in the vocabulary a search engine reads.
 *
 * This is the markup behind a price, an availability line and a star rating
 * appearing under a result rather than a bare blue link, and a shop that omits
 * it is competing for its own products against listings that do not. The site
 * already published an Organization and a WebSite graph; the thing actually
 * being sold had none.
 *
 * Every claim below is read off the record being rendered. That is the whole
 * discipline of structured data: `aggregateRating` is emitted only when there
 * are reviews to average, and `availability` follows the stock figure the page
 * itself is showing. Asserting a rating no page displays, or "in stock" for
 * something that is not, is what earns a manual penalty — and the penalty
 * removes the rich result for the whole site, not for the one product.
 */
function ProductStructuredData({
  locale,
  product,
  reviewCount,
}: {
  locale: string;
  product: Product;
  reviewCount: number;
}) {
  const url = absoluteUrl(locale, `/product/${product.slug}`);
  const images = [product.image, ...(product.images ?? [])].filter(Boolean);

  const graph: Record<string, unknown> = {
    "@type": "Product",
    "@id": `${url}#product`,
    name: product.name,
    description: product.description,
    image: images.length ? images : undefined,
    sku: product._id,
    category: product.category,
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "USD",
      price: product.price.toFixed(2),
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@id": `${siteUrl}/#organization` },
    },
  };

  /* Only when the page is showing one. */
  if (reviewCount > 0 && product.rating > 0) {
    graph.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: product.rating.toFixed(1),
      reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({ "@context": "https://schema.org", ...graph }),
      }}
    />
  );
}
