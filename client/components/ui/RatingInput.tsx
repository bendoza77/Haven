"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

const stars = [1, 2, 3, 4, 5];

/**
 * Star picker for writing a review.
 *
 * Built from real radio inputs rather than buttons, so it arrives in the form
 * like any other field, is reachable with arrow keys, and announces itself to
 * a screen reader as "Rating, 4 of 5" without any wiring of our own. The stars
 * are the radio's label; the input itself is visually hidden, not removed.
 */
export default function RatingInput({
  name = "rating",
  defaultValue = 0,
  disabled,
}: {
  name?: string;
  defaultValue?: number;
  disabled?: boolean;
}) {
  const t = useTranslations("reviews");
  const [value, setValue] = useState(defaultValue);
  const [hovered, setHovered] = useState(0);

  /* What the eye should see: the hovered value while pointing, else the choice. */
  const shown = hovered || value;

  return (
    <div className="flex items-center gap-3">
      <fieldset
        disabled={disabled}
        className="flex items-center"
        onMouseLeave={() => setHovered(0)}
      >
        <legend className="sr-only">Rating</legend>

        {stars.map((star) => (
          <label
            key={star}
            onMouseEnter={() => setHovered(star)}
            className={cn(
              "cursor-pointer p-0.5 transition-transform",
              !disabled && "hover:scale-110",
              disabled && "cursor-not-allowed",
            )}
          >
            <input
              type="radio"
              name={name}
              value={star}
              checked={value === star}
              onChange={() => setValue(star)}
              className="sr-only peer"
            />
            <Star
              aria-hidden
              className={cn(
                "size-6 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ink",
                star <= shown ? "fill-ink text-ink" : "fill-none text-line-strong",
              )}
              strokeWidth={1.5}
            />
            <span className="sr-only">
              {t("starsLabel", { count: star, word: t(`ratingWords.${star}`) })}
            </span>
          </label>
        ))}
      </fieldset>

      <span className="text-sm text-ink-muted" aria-hidden>
        {shown ? t(`ratingWords.${shown}`) : t("pickARating")}
      </span>
    </div>
  );
}
