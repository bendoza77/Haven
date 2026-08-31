import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Compass } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import { categories } from "@/data/catalog";

/**
 * The 404 itself, without any chrome around it.
 *
 * Two boundaries render this. The one inside the (storefront) group already
 * sits under the shop header and footer; the root one has to bring them
 * along. Sharing the body keeps the two from drifting — and keeps the header
 * from being drawn twice, which is what happened when the root 404 rendered
 * inside the group layout.
 */
export default function NotFoundBody() {
  const t = useTranslations("notFound");
  const tCat = useTranslations("categories");

  return (
    <Container className="py-20 lg:py-32">
      <div className="mx-auto max-w-xl text-center">
        <p className="font-display text-7xl leading-none tracking-tight text-ink sm:text-8xl">{t("code")}</p>
        <h1 className="mt-6 font-display text-3xl tracking-tight text-ink sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-ink-muted">{t("body")}</p>

        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/" size="lg">
            {t("home")}
          </ButtonLink>
          <ButtonLink href="/shop" size="lg" variant="secondary">
            {t("shop")}
          </ButtonLink>
        </div>

        <div className="mt-14 border-t border-line pt-8">
          <p className="flex items-center justify-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-ink-subtle">
            <Compass className="size-4" aria-hidden />
            {t("popularCategories")}
          </p>
          <ul className="mt-5 flex flex-wrap justify-center gap-2">
            {categories.map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/category/${category.slug}`}
                  className="inline-flex rounded-full border border-line px-4 py-2 text-sm text-ink-muted transition-colors hover:border-ink hover:text-ink"
                >
                  {tCat(`${category.slug}.name`)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Container>
  );
}
