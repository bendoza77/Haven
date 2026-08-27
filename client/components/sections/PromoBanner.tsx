import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import { editorial } from "@/data/catalog";

export default async function PromoBanner() {
  const t = await getTranslations("promo");

  return (
    <section className="pb-16 lg:pb-24">
      <Container>
        <div className="overflow-hidden rounded-lg bg-feature text-feature-ink">
          <div className="grid lg:grid-cols-2">
            <div className="flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-14 lg:py-20">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-feature-ink/60">
                {t("eyebrow")}
              </p>
              <h2 className="mt-5 font-display text-4xl leading-tight tracking-tight ka:text-3xl sm:text-5xl ka:sm:text-4xl">
                {t("title")}
              </h2>
              <p className="mt-5 max-w-md text-base leading-relaxed text-feature-ink/70">
                {t("body")}
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <ButtonLink href="/shop?filter=sale" size="lg" variant="inverse">
                  {t("saleCta")}
                </ButtonLink>
                <ButtonLink href="/shop?sort=newest" size="lg" variant="inverseOutline">
                  {t("newCta")}
                </ButtonLink>
              </div>
            </div>

            <div className="relative order-first min-h-64 lg:order-last lg:min-h-full">
              <Image
                src={editorial.promo}
                alt={t("imageAlt")}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
