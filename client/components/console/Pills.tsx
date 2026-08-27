import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { LOW_STOCK, roleLabelKey } from "@/lib/console";

const base =
  "inline-flex items-center gap-1.5 rounded-sm px-2 py-1 text-[0.6875rem] font-medium uppercase tracking-[0.08em]";

/* Every state carries a dot as well as a colour, so the tables stay
   readable without relying on hue alone. */
function Dot({ className }: { className: string }) {
  return <span aria-hidden className={cn("size-1.5 rounded-full", className)} />;
}

export function StatusPill({ active }: { active: boolean }) {
  const t = useTranslations("console.pills");

  return (
    <span
      className={cn(
        base,
        active ? "bg-success/10 text-success" : "bg-surface-strong text-ink-muted",
      )}
    >
      <Dot className={active ? "bg-success" : "bg-ink-subtle"} />
      {active ? t("live") : t("draft")}
    </span>
  );
}

export function StockPill({ stock }: { stock: number }) {
  const t = useTranslations("console.pills");

  if (stock === 0) {
    return (
      <span className={cn(base, "bg-danger/10 text-danger")}>
        <Dot className="bg-danger" />
        {t("outOfStock")}
      </span>
    );
  }

  if (stock <= LOW_STOCK) {
    return (
      <span className={cn(base, "bg-warning/12 text-warning")}>
        <Dot className="bg-warning" />
        {t("left", { count: stock })}
      </span>
    );
  }

  return <span className="text-sm text-ink">{stock}</span>;
}

const roleTones: Record<string, string> = {
  admin: "bg-ink text-canvas",
  moderator: "bg-accent-soft text-accent",
  user: "bg-surface-strong text-ink-muted",
};

export function RolePill({ role }: { role: string }) {
  const t = useTranslations("console");
  const key = roleLabelKey(role);

  return (
    <span className={cn(base, roleTones[role] ?? roleTones.user)}>
      {key ? t(key) : role}
    </span>
  );
}

export function VerifiedPill({ verified }: { verified: boolean }) {
  const t = useTranslations("console.pills");

  return (
    <span className={cn(base, verified ? "bg-success/10 text-success" : "bg-surface-strong text-ink-subtle")}>
      <Dot className={verified ? "bg-success" : "bg-ink-subtle"} />
      {verified ? t("verified") : t("pending")}
    </span>
  );
}
