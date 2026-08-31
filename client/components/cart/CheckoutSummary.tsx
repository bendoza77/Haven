"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Loader2, ShoppingBag } from "lucide-react";
import OrderSummary from "@/components/cart/OrderSummary";
import { Button, ButtonLink } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { getOrderSummary } from "@/lib/cart";
import { useMoney } from "@/lib/format";

/**
 * The right-hand side of checkout: the real bag and what it comes to.
 *
 * The button that places the order lives here but submits the form beside it,
 * joined by `formId` — which is why this takes its label and busy state from
 * the flow rather than owning them.
 */
export default function CheckoutSummary({
  formId,
  busy,
  label,
}: {
  formId?: string;
  busy?: boolean;
  label?: React.ReactNode;
}) {
  const t = useTranslations("checkout");
  const tAuth = useTranslations("auth");
  const tCart = useTranslations("cart");
  const money = useMoney();

  const { user, loading } = useAuth();

  if (loading) {
    return (
      <p className="flex items-center justify-center gap-2.5 rounded-lg border border-line px-4 py-16 text-sm text-ink-muted">
        <Loader2 className="size-4 animate-spin" strokeWidth={1.75} aria-hidden />
        {tCart("loading")}
      </p>
    );
  }

  const lines = user?.cart ?? [];

  if (lines.length === 0) {
    return (
      <div className="rounded-lg border border-line p-6 text-center">
        <span
          aria-hidden
          className="mx-auto flex size-12 items-center justify-center rounded-full bg-surface text-ink-muted"
        >
          <ShoppingBag className="size-5" strokeWidth={1.75} />
        </span>
        <h2 className="mt-4 font-display text-xl tracking-tight text-ink">
          {user ? t("emptyTitle") : t("signInTitle")}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          {user ? t("emptyBody") : t("signInBody")}
        </p>
        <div className="mt-6">
          <ButtonLink href={user ? "/shop" : "/login?next=%2Fcheckout"} fullWidth>
            {user ? t("browseCollection") : tAuth("signIn")}
          </ButtonLink>
        </div>
      </div>
    );
  }

  const { subtotal, shipping, total, itemCount } = getOrderSummary(lines);

  return (
    <>
      <OrderSummary subtotal={subtotal} shipping={shipping} total={total} itemCount={itemCount}>
        <Button type="submit" form={formId} disabled={busy} fullWidth size="lg">
          {label ?? t("placeOrder")}
        </Button>
        <ButtonLink href="/cart" fullWidth variant="secondary">
          {t("backToCart")}
        </ButtonLink>
      </OrderSummary>

      <section aria-labelledby="items-heading" className="mt-6 rounded-lg border border-line p-6">
        <h2
          id="items-heading"
          className="text-xs font-medium uppercase tracking-[0.16em] text-ink"
        >
          {t("inThisOrder")}
        </h2>
        <ul className="mt-5 space-y-4">
          {lines.map((line) => {
            const option = [line.color, line.size].filter(Boolean).join(" · ");

            return (
              <li key={line._id} className="flex gap-4">
                <Link
                  href={`/product/${line.product.slug}`}
                  className="relative size-16 shrink-0 overflow-hidden rounded-md bg-surface"
                >
                  <Image
                    src={line.product.image}
                    alt={line.product.name}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{line.product.name}</p>
                  <p className="mt-0.5 text-xs text-ink-subtle">
                    {t("qty", { count: line.quantity })}
                    {option && ` · ${option}`}
                  </p>
                </div>
                <p className="text-sm tabular-nums text-ink">
                  {money(line.product.price * line.quantity)}
                </p>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
