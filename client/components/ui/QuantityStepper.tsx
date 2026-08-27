"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/* The bag line cap in the user model. Nothing may exceed it whatever the
   shelf holds. */
const HARD_CAP = 99;

/**
 * Visual quantity control. Uncontrolled by default; pass `value` and
 * `onChange` when the parent needs to know about the change.
 *
 * `max` is what is actually on the shelf. The API refuses an over-order
 * either way, so this is not the rule — it is what stops a shopper walking
 * into that refusal, by disabling the control at the limit and saying why
 * instead of failing after the click.
 */
export default function QuantityStepper({
  defaultValue = 1,
  value,
  onChange,
  max,
  size = "md",
  label,
}: {
  defaultValue?: number;
  value?: number;
  onChange?: (value: number) => void;
  /** Units in stock. Omitted where the caller genuinely does not know. */
  max?: number;
  size?: "sm" | "md";
  /** Overrides the default "Quantity" group label where a caller needs to. */
  label?: string;
}) {
  const t = useTranslations("ui");
  const [internal, setInternal] = useState(defaultValue);
  const quantity = value ?? internal;

  /* A stock count of 0 would otherwise produce a ceiling below the floor of 1,
     leaving both buttons live on a piece nobody can buy. */
  const ceiling = Math.max(1, Math.min(HARD_CAP, max ?? HARD_CAP));
  const atCeiling = quantity >= ceiling;

  const update = (next: number) => {
    const clamped = Math.min(ceiling, Math.max(1, next));

    /* Clamping to what is already shown is not a change worth reporting — it
       would fire a needless write on every click at the limit. */
    if (clamped === quantity) return;

    if (onChange) onChange(clamped);
    else setInternal(clamped);
  };

  const button = cn(
    "flex items-center justify-center text-ink transition-colors hover:bg-surface disabled:text-line-strong disabled:hover:bg-transparent",
    size === "sm" ? "size-9" : "size-11",
  );

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border border-line-strong",
        size === "sm" ? "h-9" : "h-11",
      )}
      role="group"
      aria-label={label ?? t("quantity")}
    >
      <button
        type="button"
        className={button}
        onClick={() => update(quantity - 1)}
        disabled={quantity <= 1}
        aria-label={t("decreaseQuantity")}
      >
        <Minus className="size-4" aria-hidden />
      </button>
      <span
        className={cn("min-w-8 text-center text-sm tabular-nums", size === "sm" && "min-w-7")}
        aria-live="polite"
      >
        {quantity}
      </span>
      <button
        type="button"
        className={button}
        onClick={() => update(quantity + 1)}
        disabled={atCeiling}
        aria-label={t("increaseQuantity")}
        title={
          atCeiling && max !== undefined && max <= HARD_CAP
            ? t("onlyInStock", { count: max })
            : undefined
        }
      >
        <Plus className="size-4" aria-hidden />
      </button>
    </div>
  );
}
