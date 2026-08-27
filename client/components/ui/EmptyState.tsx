import { cn } from "@/lib/utils";

export default function EmptyState({
  icon,
  title,
  description,
  actions,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-lg border border-dashed border-line bg-surface/60 px-6 py-16 text-center",
        className,
      )}
    >
      <div className="flex size-14 items-center justify-center rounded-full bg-canvas text-ink-muted ring-1 ring-line">
        {icon}
      </div>
      <h2 className="mt-6 font-display text-2xl tracking-tight text-ink">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-muted">{description}</p>
      {actions && <div className="mt-8 flex flex-wrap justify-center gap-3">{actions}</div>}
    </div>
  );
}
