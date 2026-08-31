"use client";

import { Link } from "@/i18n/navigation";
import { usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { activeHrefIn, navigationFor, type ConsoleConfig } from "@/lib/console";
import { cn } from "@/lib/utils";

/**
 * The navigation both panels share. The active item is drawn as a raised
 * card with an accent edge so the current section is readable at a glance
 * rather than by colour alone.
 */
export default function ConsoleNav({
  config,
  onNavigate,
}: {
  config: ConsoleConfig;
  onNavigate?: () => void;
}) {
  const t = useTranslations("console");
  const pathname = usePathname();
  const groups = navigationFor(config);
  const activeHref = activeHrefIn(groups, pathname);

  return (
    <nav aria-label={t(config.labelKey)} className="flex flex-col gap-7">
      {groups.map((group) => (
        <div key={group.titleKey}>
          <p className="mb-2 px-3 text-[0.625rem] font-medium uppercase tracking-[0.18em] text-ink-subtle">
            {t(group.titleKey)}
          </p>

          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = item.href === activeHref;
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex items-start gap-3 rounded-md px-3 py-2.5 transition-colors",
                      active
                        ? "bg-canvas text-ink shadow-card"
                        : "text-ink-muted hover:bg-canvas/60 hover:text-ink",
                    )}
                  >
                    {active && (
                      <span
                        aria-hidden
                        className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-accent"
                      />
                    )}

                    <Icon
                      className={cn(
                        "mt-0.5 size-4 shrink-0 transition-colors",
                        active ? "text-accent" : "text-ink-subtle group-hover:text-ink-muted",
                      )}
                      strokeWidth={1.75}
                      aria-hidden
                    />

                    <span className="min-w-0">
                      <span
                        className={cn(
                          "block truncate text-sm leading-5",
                          active && "font-medium",
                        )}
                      >
                        {t(item.labelKey)}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-ink-subtle">
                        {t(item.hintKey)}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
