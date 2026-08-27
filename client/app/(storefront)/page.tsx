import { getTranslations } from "next-intl/server";
import CategoryCard from "@/components/category/CategoryCard";
import ProductGrid from "@/components/product/ProductGrid";
import Benefits from "@/components/sections/Benefits";
import Hero from "@/components/sections/Hero";
import PromoBanner from "@/components/sections/PromoBanner";
import { ButtonLink } from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";
import { categories } from "@/data/catalog";
import { countByCategory, getCollection } from "@/lib/products";

/* No metadata here on purpose: the root layout's `title.default` is already
   the wordmark and tagline, which is exactly what the home tab should read.
   Setting a title here would be fed through that layout's template and come
   back as "Haven — … · Haven". */

export default async function HomePage() {
  const t = await getTranslations("home");

  const [featured, newArrivals, popularAll, counts] = await Promise.all([
    getCollection("featured", 4),
    getCollection("new", 4),
    getCollection("popular", 8),
    countByCategory(),
  ]);

  const popular = popularAll.slice(4, 8);

  return (
    <>
      <Hero />
      <Benefits />

      <section className="py-16 lg:py-24">
        <Container>
          <SectionHeader
            eyebrow={t("categoriesEyebrow")}
            title={t("categoriesTitle")}
            description={t("categoriesDescription")}
            action={{ label: t("categoriesAction"), href: "/categories" }}
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3">
            {categories.slice(0, 6).map((category, index) => (
              <CategoryCard
                key={category.slug}
                category={category}
                productCount={counts[category.slug] ?? 0}
                priority={index < 3}
              />
            ))}
          </div>
        </Container>
      </section>

      <section className="pb-16 lg:pb-24">
        <Container>
          <SectionHeader
            eyebrow={t("featuredEyebrow")}
            title={t("featuredTitle")}
            action={{ label: t("featuredAction"), href: "/shop" }}
          />
          <ProductGrid products={featured} className="mt-10 lg:mt-12" />
        </Container>
      </section>

      <PromoBanner />

      <section className="border-y border-line bg-surface py-16 lg:py-24">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_1.9fr] lg:gap-16">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-ink-subtle">
                {t("newEyebrow")}
              </p>
              <h2 className="mt-3 font-display text-3xl leading-tight tracking-tight text-ink sm:text-4xl">
                {t("newTitle")}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-ink-muted">{t("newBody")}</p>
              <ButtonLink href="/shop?sort=newest" variant="secondary" className="mt-8">
                {t("newAction")}
              </ButtonLink>
            </div>

            <ProductGrid products={newArrivals} columns={2} />
          </div>
        </Container>
      </section>

      <section className="py-16 lg:py-24">
        <Container>
          <SectionHeader
            eyebrow={t("popularEyebrow")}
            title={t("popularTitle")}
            action={{ label: t("popularAction"), href: "/shop?sort=popular" }}
          />
          <ProductGrid products={popular} className="mt-10 lg:mt-12" />
        </Container>
      </section>
    </>
  );
}
