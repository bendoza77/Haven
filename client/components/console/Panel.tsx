import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A titled card. `flush` drops the body padding for panels whose content is
 * a table and needs to reach the card edge.
 */
export default function Panel({
  title,
  description,
  action,
  flush,
  className,
  children,
}: {
  title: string;
  description?: string;
  action?: { label: string; href: string };
  flush?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("rounded-lg border border-line bg-canvas", className)}>
      <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <h2 className="text-sm font-medium text-ink">{title}</h2>
          {description && <p className="mt-1 text-xs text-ink-subtle">{description}</p>}
        </div>

        {action && (
          <Link
            href={action.href}
            className="inline-flex shrink-0 items-center gap-1.5 text-xs text-ink-muted transition-colors hover:text-ink"
          >
            {action.label}
            <ArrowRight className="size-3.5" strokeWidth={1.75} aria-hidden />
          </Link>
        )}
      </div>

      <div className={flush ? "" : "px-5 py-5"}>{children}</div>
    </section>
  );
}
