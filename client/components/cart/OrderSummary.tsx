"use client";

import { useTranslations } from "next-intl";
import { useMoney } from "@/lib/format";

/** Totals panel shared by the cart and checkout pages. */
export default function OrderSummary({
  subtotal,
  shipping,
  total,
  itemCount,
  children,
}: {
  subtotal: number;
  shipping: number;
  total: number;
  itemCount: number;
  children?: React.ReactNode;
}) {
  const t = useTranslations("summary");
  const money = useMoney();

  const rows = [
    { key: "subtotal", label: t("subtotal", { count: itemCount }), value: money(subtotal) },
    { key: "shipping", label: t("shipping"), value: shipping === 0 ? t("free") : money(shipping) },
  ];

  return (
    <section
      aria-labelledby="order-summary-heading"
      className="rounded-lg border border-line bg-surface p-6"
    >
      <h2 id="order-summary-heading" className="font-display text-2xl tracking-tight text-ink">
        {t("heading")}
      </h2>

      <dl className="mt-6 space-y-3 text-sm">
        {rows.map((row) => (
          <div key={row.key} className="flex justify-between gap-4">
            <dt className="text-ink-muted">{row.label}</dt>
            <dd className="tabular-nums text-ink">{row.value}</dd>
          </div>
        ))}
        <div className="flex justify-between gap-4 border-t border-line pt-4 text-base">
          <dt className="font-medium text-ink">{t("total")}</dt>
          <dd className="font-medium tabular-nums text-ink">{money(total)}</dd>
        </div>
      </dl>

      <p className="mt-3 text-xs leading-relaxed text-ink-subtle">{t("note")}</p>

      {children && <div className="mt-6 space-y-3">{children}</div>}
    </section>
  );
}
