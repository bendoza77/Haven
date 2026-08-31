"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { AlertCircle, CheckCircle2, Clock, Loader2, Package } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import Disclosure from "@/components/ui/Disclosure";
import EmptyState from "@/components/ui/EmptyState";
import { api, type Order } from "@/lib/api";
import { useDates, useMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

import type { OrderStatus } from "@/lib/api";

const statusTones: Record<OrderStatus, "soft" | "new" | "sale" | "bestseller"> = {
  Delivered: "soft",
  "In transit": "new",
  Processing: "bestseller",
  Cancelled: "sale",
  /* Neither good news nor bad yet — the quiet tone, so an order mid-payment
     does not shout louder than one that has actually shipped. */
  "Awaiting payment": "soft",
  "Payment failed": "sale",
};

/**
 * The shopper's real order history.
 *
 * Each order carries the names and prices it was placed with rather than
 * looking them up now, so a piece that has since been repriced or withdrawn
 * still shows what was actually paid — see the order model for why.
 */
export default function AccountOrders() {
  const t = useTranslations("orders");
  const params = useSearchParams();

  /* Stripe returns the shopper here with the reference it was given. Used only
     to point at the right row and say the payment went through — the order is
     already marked paid by the webhook, which is the account that counts.
     Landing on this URL is not itself proof of anything. */
  const justPaid = params.get("order");
  const tSummary = useTranslations("summary");
  const money = useMoney();
  const dates = useDates();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    api.orders
      .mine()
      .then((response) => {
        if (!cancelled) setOrders(response.data);
      })
      .catch((failure: unknown) => {
        if (!cancelled) {
          setError(failure instanceof Error ? failure.message : t("couldNotLoad"));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [t]);

  if (loading) {
    return (
      <p className="flex items-center justify-center gap-2.5 py-16 text-sm text-ink-muted">
        <Loader2 className="size-4 animate-spin" strokeWidth={1.75} aria-hidden />
        {t("loading")}
      </p>
    );
  }

  if (error) {
    return (
      <p className="flex items-start gap-2.5 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
        <AlertCircle className="mt-px size-4 shrink-0" strokeWidth={1.75} aria-hidden />
        {error}
      </p>
    );
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={<Package className="size-6" strokeWidth={1.5} aria-hidden />}
        title={t("emptyTitle")}
        description={t("emptyBody")}
        actions={<ButtonLink href="/shop">{t("startShopping")}</ButtonLink>}
      />
    );
  }

  return (
    <>
      {justPaid && orders.some((order) => order.reference === justPaid) && (
        <p className="mb-5 flex items-start gap-2.5 rounded-lg border border-ink/15 bg-surface px-4 py-3.5 text-sm leading-relaxed text-ink">
          <CheckCircle2 className="mt-px size-4 shrink-0" strokeWidth={1.75} aria-hidden />
          {t("paidBanner", { reference: justPaid })}
        </p>
      )}

      <ul className="space-y-4">
        {orders.map((order) => (
          <li
            key={order._id}
            className={cn(
              "rounded-lg border p-5 sm:p-6",
              order.reference === justPaid ? "border-ink" : "border-line",
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-ink">{order.reference}</p>
                <p className="mt-1 text-xs text-ink-subtle">
                  {t("placed", { date: dates.long(order.createdAt) })}
                </p>
              </div>
              <Badge tone={statusTones[order.status]}>{t(`status.${order.status}`)}</Badge>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-ink-muted">
                {t("itemsAndTotal", { count: order.itemCount })} ·{" "}
                <span className="font-medium text-ink">{money(order.total)}</span>
              </p>
            </div>

            {/* An order can sit unpaid: the session was opened and the shopper
                walked away, or the card was refused. Saying so is the whole
                point — otherwise it reads as a placed order that never came. */}
            {order.status === "Awaiting payment" && (
              <p className="mt-4 flex items-start gap-2.5 rounded-md bg-surface px-3.5 py-3 text-xs leading-relaxed text-ink-muted">
                <Clock className="mt-px size-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
                {t("awaitingPayment")}
              </p>
            )}

            {order.status === "Payment failed" && (
              <p className="mt-4 flex items-start gap-2.5 rounded-md border border-danger/25 bg-danger/5 px-3.5 py-3 text-xs leading-relaxed text-ink">
                <AlertCircle className="mt-px size-3.5 shrink-0 text-danger" strokeWidth={1.75} aria-hidden />
                {t("paymentFailed")}
              </p>
            )}

            {/* The pieces themselves, so the reference is not the only thing
                distinguishing one order from another at a glance. */}
            <ul className="mt-5 space-y-3 border-t border-line pt-5">
              {order.items.map((item, index) => (
                <li key={`${item.slug ?? item.name}-${index}`} className="flex items-center gap-3">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt=""
                      width={48}
                      height={48}
                      className="size-12 shrink-0 rounded-md border border-line object-cover"
                    />
                  ) : (
                    <span className="size-12 shrink-0 rounded-md border border-line bg-surface" aria-hidden />
                  )}

                  <span className="min-w-0 flex-1">
                    {item.slug ? (
                      <Link
                        href={`/product/${item.slug}`}
                        className="block truncate text-sm text-ink transition-colors hover:text-accent"
                      >
                        {item.name}
                      </Link>
                    ) : (
                      <span className="block truncate text-sm text-ink">{item.name}</span>
                    )}
                    <span className="block truncate text-xs text-ink-subtle">
                      {[item.size, item.color].filter(Boolean).join(" · ") || " "}
                    </span>
                  </span>

                  <span className="shrink-0 text-right text-sm text-ink-muted">
                    {item.quantity} × {money(item.price)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-4">
              <Disclosure title={t("deliveryDetails")}>
                <div className="space-y-3">
                  <p>
                    {t("deliveryTo", { method: t(`method.${order.deliveryMethod}`) })}{" "}
                    <span className="text-ink">{order.shipping.recipient}</span>.
                  </p>

                  <address className="not-italic leading-relaxed">
                    {order.shipping.line1}
                    {order.shipping.line2 ? `, ${order.shipping.line2}` : ""}
                    <br />
                    {order.shipping.city}
                    {order.shipping.region ? `, ${order.shipping.region}` : ""} {order.shipping.postcode}
                    <br />
                    {order.shipping.country}
                  </address>

                  <dl className="grid gap-1.5 border-t border-line pt-3 text-xs">
                    {[
                      { key: "subtotal", label: tSummary("subtotal", { count: order.itemCount }), value: money(order.subtotal) },
                      {
                        key: "shipping",
                        label: tSummary("shipping"),
                        value: order.shippingCost === 0 ? tSummary("free") : money(order.shippingCost),
                      },
                      { key: "tax", label: tSummary("tax"), value: money(order.tax) },
                    ].map((row) => (
                      <div key={row.key} className="flex justify-between gap-3">
                        <dt>{row.label}</dt>
                        <dd className="text-ink">{row.value}</dd>
                      </div>
                    ))}
                    <div className="flex justify-between gap-3 border-t border-line pt-1.5 text-sm">
                      <dt className="font-medium text-ink">{tSummary("total")}</dt>
                      <dd className="font-medium text-ink">{money(order.total)}</dd>
                    </div>
                  </dl>
                </div>
              </Disclosure>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
