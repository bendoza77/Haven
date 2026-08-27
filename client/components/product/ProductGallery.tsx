"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/** Main image with selectable thumbnails. Selection is local to the page. */
export default function ProductGallery({
  images,
  name,
}: {
  images: string[];
  name: string;
}) {
  const t = useTranslations("product");
  const [active, setActive] = useState(0);

  return (
    <div className="flex flex-col gap-4 self-start lg:flex-row-reverse lg:gap-6">
      <div className="relative aspect-square flex-1 overflow-hidden rounded-lg bg-surface">
        <Image
          key={images[active]}
          src={images[active]}
          alt={name}
          fill
          sizes="(min-width: 1024px) 45vw, 100vw"
          priority
          className="object-cover"
        />
      </div>

      {images.length > 1 && (
        <ul className="flex gap-3 lg:w-20 lg:flex-col" role="tablist" aria-label={t("galleryImages", { name })}>
          {images.map((image, index) => (
            <li key={image} className="flex-1 lg:flex-none">
              <button
                type="button"
                role="tab"
                aria-selected={index === active}
                aria-label={t("viewImage", { index: index + 1, total: images.length })}
                onClick={() => setActive(index)}
                className={cn(
                  "relative block aspect-square w-full overflow-hidden rounded-md bg-surface ring-1 transition-all",
                  index === active
                    ? "ring-2 ring-ink"
                    : "ring-line hover:ring-line-strong",
                )}
              >
                <Image
                  src={image}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 80px, 30vw"
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
