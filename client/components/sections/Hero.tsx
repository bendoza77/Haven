import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import { editorial } from "@/data/catalog";

/* Values are translated alongside their labels: "10yr" is an abbreviation,
   and abbreviations do not survive a language change. */
const stats = ["makers", "warranty", "rating"] as const;

export default async function Hero() {
  const t = await getTranslations("hero");

  return (
    <section className="border-b border-line bg-surface">
      <Container>
        <div className="grid items-center gap-10 py-12 lg:grid-cols-12 lg:gap-12 lg:py-20">
          <div className="lg:col-span-5">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-ink-subtle">
              {t("eyebrow")}
            </p>
            <h1 className="mt-5 font-display text-[2.75rem] leading-[1.05] tracking-tight text-ink ka:text-[2.25rem] sm:text-6xl ka:sm:text-5xl lg:text-[4.25rem] ka:lg:text-[3.25rem]">
              {t("title")}
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-ink-muted sm:text-lg">
              {t("body")}
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink href="/shop" size="lg">
                {t("shopCta")}
              </ButtonLink>
              <ButtonLink href="/categories" size="lg" variant="secondary">
                {t("browseCta")}
              </ButtonLink>
            </div>

            <dl className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-line pt-8">
              {stats.map((stat) => (
                <div key={stat}>
                  <dt className="sr-only">{t(`stats.${stat}Label`)}</dt>
                  <dd>
                    <span className="block font-display text-3xl text-ink">
                      {t(`stats.${stat}Value`)}
                    </span>
                    <span className="mt-1 block text-xs leading-snug text-ink-subtle">
                      {t(`stats.${stat}Label`)}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative lg:col-span-7">
            <div className="relative aspect-4/3 overflow-hidden rounded-lg bg-surface-strong sm:aspect-16/10 lg:aspect-4/3">
              <Image
                src={editorial.hero}
                alt={t("imageAlt")}
                fill
                sizes="(min-width: 1024px) 58vw, 100vw"
                priority
                className="object-cover"
              />
            </div>

            <div className="absolute -bottom-10 -left-14 hidden w-52 overflow-hidden rounded-lg ring-8 ring-surface xl:block">
              <div className="relative aspect-square">
                <Image
                  src={editorial.heroSecondary}
                  alt={t("secondaryImageAlt")}
                  fill
                  sizes="208px"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
