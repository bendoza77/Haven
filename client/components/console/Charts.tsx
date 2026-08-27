"use client";

import { useTranslations } from "next-intl";
import { useCounts, useDates } from "@/lib/format";

/**
 * Six months of movement, drawn as paired bars. Two series against one
 * shared scale would flatten the smaller one, so each keeps its own — the
 * chart is about shape over time, not about products against sign-ups.
 *
 * `showUsers` is off in the console that cannot read the roster: a sign-ups
 * series pinned at zero, with a key naming it, would read as "nobody signed
 * up" rather than "this console was never told".
 */
export function ActivityChart({
  data,
  showUsers = true,
}: {
  /* A Date rather than a formatted string: the month tick is written
     differently in each language, so the chart formats it rather than the
     caller baking in an English abbreviation. */
  data: { date: Date; products: number; users: number }[];
  showUsers?: boolean;
}) {
  const t = useTranslations("console.charts");
  const dates = useDates();
  const peakProducts = Math.max(...data.map((month) => month.products), 1);
  const peakUsers = Math.max(...data.map((month) => month.users), 1);

  return (
    <div>
      <ul className="flex items-end justify-between gap-3 sm:gap-5">
        {data.map((month) => (
          <li
            key={month.date.toISOString()}
            className="flex min-w-0 flex-1 flex-col items-center gap-3"
          >
            <div className="flex h-40 w-full items-end justify-center gap-1.5">
              <span
                className={`${showUsers ? "w-1/2" : "w-2/3"} max-w-6 rounded-t-sm bg-ink transition-[height]`}
                style={{ height: `${Math.max(4, (month.products / peakProducts) * 100)}%` }}
                title={t("productsCount", { count: month.products })}
              />
              {showUsers && (
                <span
                  className="w-1/2 max-w-6 rounded-t-sm bg-accent/70 transition-[height]"
                  style={{ height: `${Math.max(4, (month.users / peakUsers) * 100)}%` }}
                  title={t("signUpsCount", { count: month.users })}
                />
              )}
            </div>
            <span className="text-xs text-ink-subtle">{dates.month(month.date)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-wrap items-center gap-5 border-t border-line pt-4">
        <Key className="bg-ink" label={t("productsAdded")} />
        {showUsers && <Key className="bg-accent/70" label={t("newSignUps")} />}
      </div>
    </div>
  );
}

function Key({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-2 text-xs text-ink-muted">
      <span aria-hidden className={`size-2.5 rounded-sm ${className}`} />
      {label}
    </span>
  );
}

/** Category mix as a ranked list of proportional bars. */
export function CategoryBars({
  data,
}: {
  data: { category: string; count: number }[];
}) {
  const t = useTranslations("categories");
  const { count: formatCount } = useCounts();
  const peak = Math.max(...data.map((entry) => entry.count), 1);

  return (
    <ul className="space-y-4">
      {data.map((entry) => (
        <li key={entry.category}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="truncate text-sm text-ink">{t(`${entry.category}.name`)}</span>
            <span className="shrink-0 text-xs tabular-nums text-ink-subtle">
              {formatCount(entry.count)}
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-strong">
            <div
              className="h-full rounded-full bg-ink"
              style={{ width: `${(entry.count / peak) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
