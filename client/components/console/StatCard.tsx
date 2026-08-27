import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * One number, said once. The label is the question, the display figure is
 * the answer, and the foot carries whatever context stops it being read
 * the wrong way.
 */
export default function StatCard({
  label,
  value,
  hint,
  trend,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  trend?: { value: string; direction: "up" | "down" };
  icon: LucideIcon;
}) {
  const Arrow = trend?.direction === "down" ? TrendingDown : TrendingUp;

  return (
    <div className="rounded-lg border border-line bg-canvas p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-ink-subtle">
          {label}
        </p>
        <span
          aria-hidden
          className="flex size-8 shrink-0 items-center justify-center rounded-md bg-surface text-ink-muted"
        >
          <Icon className="size-4" strokeWidth={1.75} />
        </span>
      </div>

      <p className="mt-4 font-display text-3xl leading-none tracking-tight text-ink">{value}</p>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        {trend && (
          <span
            className={cn(
              "inline-flex items-center gap-1 font-medium",
              trend.direction === "up" ? "text-success" : "text-danger",
            )}
          >
            <Arrow className="size-3.5" strokeWidth={2} aria-hidden />
            {trend.value}
          </span>
        )}
        {hint && <span className="text-ink-subtle">{hint}</span>}
      </div>
    </div>
  );
}
