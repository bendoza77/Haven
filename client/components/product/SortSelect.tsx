"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export type SortOption = { value: string; label: string; href: string };

/** Native select that navigates to the matching sorted URL. */
export default function SortSelect({
  value,
  options,
}: {
  value: string;
  options: SortOption[];
}) {
  const t = useTranslations("browser");
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort" className="shrink-0 text-sm text-ink-muted">
        {t("sortLabel")}
      </label>
      <select
        id="sort"
        value={value}
        onChange={(event) => {
          const option = options.find((item) => item.value === event.target.value);
          if (option) router.push(option.href);
        }}
        className="h-10 rounded-md border border-line-strong bg-canvas px-3 text-sm text-ink transition-colors hover:border-ink focus:border-ink focus:outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
