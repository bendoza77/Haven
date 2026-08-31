"use client";

import { useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { AlertCircle, Loader2, ShoppingBag, Trash2 } from "lucide-react";
import OrderSummary from "@/components/cart/OrderSummary";
import { ButtonLink } from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Price from "@/components/ui/Price";
import QuantityStepper from "@/components/ui/QuantityStepper";
import { useAuth } from "@/context/AuthContext";
import { getOrderSummary, remainingForFreeShipping } from "@/lib/cart";
import { useMoney } from "@/lib/format";

/**
 * The bag, read off the signed-in account.
 *
 * Every change is a write to the database that answers with the whole
 * account, so the list, the totals and the header count can never drift
 * apart — there is only ever one copy of this state.
 */
export default function CartClient() {
  const t = useTranslations("cart");
  const tAuth = useTranslations("auth");
  const money = useMoney();

  const { user, loading, updateCartItem, removeCartItem } = useAuth();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return (
      <p className="flex items-center justify-center gap-2.5 py-20 text-sm text-ink-muted">
        <Loader2 className="size-4 animate-spin" strokeWidth={1.75} aria-hidden />
        {t("loading")}
      </p>
    );
  }

  if (!user) {
    return (
      <EmptyState
        icon={<ShoppingBag className="size-6" aria-hidden />}
        title={t("signInTitle")}
        description={t("signInBody")}
        actions={
          <>
            <ButtonLink href="/login?next=%2Fcart">{tAuth("signIn")}</ButtonLink>
            <ButtonLink href="/register" variant="secondary">
              {tAuth("createAccount")}
            </ButtonLink>
          </>
        }
      />
    );
  }

  const lines = user.cart ?? [];

  if (lines.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag className="size-6" aria-hidden />}
        title={t("emptyTitle")}
        description={t("emptyBody")}
        actions={
          <>
            <ButtonLink href="/shop">{t("continueShopping")}</ButtonLink>
            <ButtonLink href="/wishlist" variant="secondary">
              {t("viewWishlist")}
            </ButtonLink>
          </>
        }
      />
    );
  }

  const { subtotal, shipping, total, itemCount } = getOrderSummary(lines);
  const remaining = remainingForFreeShipping(subtotal);

  const run = async (id: string, action: () => Promise<void>) => {
    setBusy(id);
    setError(null);
    try {
      await action();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : t("couldNotUpdate"));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-14">
      <div>
        {error && (
          <p className="mb-6 flex items-start gap-2.5 rounded-md bg-danger/10 px-4 py-3 text-sm text-danger">
            <AlertCircle className="mt-px size-4 shrink-0" strokeWidth={1.75} aria-hidden />
            {error}
          </p>
        )}

        <ul className="border-t border-line">
          {lines.map((line) => {
            const option = [line.color, line.size].filter(Boolean).join(" · ");

            return (
              <li key={line._id} className="flex gap-4 border-b border-line py-6 sm:gap-6">
                <Link
                  href={`/product/${line.product.slug}`}
                  className="relative size-24 shrink-0 overflow-hidden rounded-md bg-surface sm:size-32"
                >
                  <Image
                    src={line.product.image}
                    alt={line.product.name}
                    fill
                    sizes="128px"
                    className="object-cover"
                  />
                </Link>

                <div className="flex min-w-0 flex-1 flex-col gap-3">
                  <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                    <div className="min-w-0">
                      <h2 className="text-[0.9375rem] font-medium leading-snug text-ink">
                        <Link
                          href={`/product/${line.product.slug}`}
                          className="transition-colors hover:text-accent"
                        >
                          {line.product.name}
                        </Link>
                      </h2>
                      {option && <p className="mt-1 text-sm text-ink-subtle">{option}</p>}
                      {line.product.stock < line.quantity && (
                        <p className="mt-1 text-sm text-warning">
                          {t("onlyLeftInStock", { count: line.product.stock })}
                        </p>
                      )}
                    </div>
                    <Price
                      price={line.product.price * line.quantity}
                      previousPrice={
                        line.product.previousPrice
                          ? line.product.previousPrice * line.quantity
                          : undefined
                      }
                      size="sm"
                    />
                  </div>

                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
                    <QuantityStepper
                      size="sm"
                      value={line.quantity}
                      onChange={(quantity) =>
                        run(line._id, () => updateCartItem(line._id, quantity))
                      }
                      max={line.product.stock}
                      label={t("quantityFor", { name: line.product.name })}
                    />
                    <button
                      type="button"
                      disabled={busy === line._id}
                      onClick={() => run(line._id, () => removeCartItem(line._id))}
                      className="-my-2 flex items-center gap-1.5 py-2 text-sm text-ink-subtle transition-colors hover:text-danger disabled:opacity-60"
                    >
                      {busy === line._id ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                      ) : (
                        <Trash2 className="size-4" aria-hidden />
                      )}
                      {t("remove")}
                      <span className="sr-only"> {line.product.name}</span>
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mt-8">
          <ButtonLink href="/shop" variant="secondary">
            {t("continueShopping")}
          </ButtonLink>
        </div>
      </div>

      <div className="lg:sticky lg:top-28 lg:self-start">
        <OrderSummary
          subtotal={subtotal}
          shipping={shipping}
          total={total}
          itemCount={itemCount}
        >
          <ButtonLink href="/checkout" fullWidth size="lg">
            {t("proceedToCheckout")}
          </ButtonLink>
          {remaining > 0 && (
            <p className="text-center text-xs text-ink-muted">
              {t("addMoreForFreeDelivery", { amount: money(remaining) })}
            </p>
          )}
        </OrderSummary>
      </div>
    </div>
  );
}
