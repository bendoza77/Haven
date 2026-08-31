import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CreditCard, RotateCcw } from "lucide-react";
import Container from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("checkoutFailed");

  return {
    title: t("title"),
    description: t("intro"),
    /* Nothing here belongs in a search result. */
    robots: { index: false, follow: false },
  };
}

/**
 * Where Stripe returns somebody who did not pay.
 *
 * Deliberately not an error page. Cancelling a payment is an ordinary thing to
 * do — far more often it is second thoughts, or a card left in another room,
 * than anything that went wrong — so the page is calm, says nothing is owed,
 * and puts the bag back within one click. Treating this as a failure would
 * make the shop feel broken over a decision the shopper made on purpose.
 *
 * The bag is deliberately untouched: it is emptied only when a payment
 * succeeds, so everything is still exactly where it was left.
 */
export default async function CheckoutFailedPage({
  searchParams,
}: PageProps<"/[locale]/checkout/failed">) {
  const t = await getTranslations("checkoutFailed");
  const { order } = await searchParams;

  const reference = typeof order === "string" ? order : null;

  return (
    <Container className="py-20 lg:py-28">
      <div className="mx-auto max-w-lg text-center">
        <span
          aria-hidden
          className="mx-auto flex size-14 items-center justify-center rounded-full bg-surface text-ink"
        >
          <CreditCard className="size-6" strokeWidth={1.5} />
        </span>

        <h1 className="mt-6 font-display text-3xl leading-tight tracking-tight text-ink sm:text-4xl">
          {t("title")}
        </h1>

        <p className="mt-4 text-sm leading-relaxed text-ink-muted">{t("intro")}</p>

        {reference && (
          <p className="mt-3 text-xs text-ink-subtle">
            {t("reference", { reference })}
          </p>
        )}

        <p className="mt-6 rounded-lg border border-line bg-surface px-4 py-3.5 text-sm leading-relaxed text-ink-muted">
          {t("bagKept")}
        </p>

        <div className="mt-8 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <ButtonLink href="/checkout">
            <RotateCcw className="size-4" strokeWidth={1.75} aria-hidden />
            {t("tryAgain")}
          </ButtonLink>
          <ButtonLink href="/cart" variant="secondary">
            {t("reviewBag")}
          </ButtonLink>
        </div>

        <p className="mt-8 text-xs leading-relaxed text-ink-subtle">{t("help")}</p>
      </div>
    </Container>
  );
}
