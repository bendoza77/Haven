"use client";

import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Colour = { name: string; hex: string };

/**
 * Colour and size pickers. Controlled, because the choice has to travel with
 * the piece into the bag — the parent owns it.
 */
export default function ProductOptions({
  colors,
  sizes,
  colour,
  size,
  onColourChange,
  onSizeChange,
}: {
  colors?: Colour[];
  sizes?: string[];
  colour?: string;
  size?: string;
  onColourChange: (value: string) => void;
  onSizeChange: (value: string) => void;
}) {
  const t = useTranslations("product");

  if (!colors?.length && !sizes?.length) return null;

  return (
    <div className="space-y-6">
      {colors && colors.length > 0 && (
        <div>
          <p className="mb-3 text-sm font-medium text-ink">
            {t("colour")}: <span className="font-normal text-ink-muted">{colour}</span>
          </p>
          <ul className="flex flex-wrap gap-3">
            {colors.map((option) => (
              <li key={option.name}>
                <button
                  type="button"
                  onClick={() => onColourChange(option.name)}
                  aria-pressed={colour === option.name}
                  aria-label={option.name}
                  title={option.name}
                  className={cn(
                    "flex size-10 items-center justify-center rounded-full ring-1 ring-inset ring-ink/10 transition-shadow",
                    colour === option.name && "ring-2 ring-ink ring-offset-2 ring-offset-canvas",
                  )}
                  style={{ backgroundColor: option.hex }}
                >
                  {colour === option.name && (
                    <Check
                      className="size-4 mix-blend-difference text-canvas"
                      strokeWidth={2.5}
                      aria-hidden
                    />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {sizes && sizes.length > 0 && (
        <div>
          <p className="mb-3 text-sm font-medium text-ink">
            {t("size")}: <span className="font-normal text-ink-muted">{size}</span>
          </p>
          <ul className="flex flex-wrap gap-2">
            {sizes.map((option) => (
              <li key={option}>
                <button
                  type="button"
                  onClick={() => onSizeChange(option)}
                  aria-pressed={size === option}
                  className={cn(
                    "h-11 min-w-14 rounded-md border px-3 text-sm transition-colors",
                    size === option
                      ? "border-ink bg-ink text-canvas"
                      : "border-line-strong text-ink hover:border-ink",
                  )}
                >
                  {option}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
