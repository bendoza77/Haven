"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Bell, Menu, Search, X } from "lucide-react";
import ConsoleSidebar from "@/components/console/ConsoleSidebar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useConsoleAuth } from "@/context/ConsoleAuthContext";
import { initialsOf, staffName, type ConsoleConfig } from "@/lib/console";

/**
 * Console frame: a fixed rail from `lg` up, a drawer below it, and a sticky
 * bar carrying the controls that do not belong to any single screen.
 */
export default function ConsoleShell({
  config,
  children,
}: {
  config: ConsoleConfig;
  children: React.ReactNode;
}) {
  const t = useTranslations("console");
  const [open, setOpen] = useState(false);
  const { staff } = useConsoleAuth();

  /* Falls back to the translated placeholder rather than an English one baked
     into lib/console. */
  const name = staffName(staff) ?? t("shell.signedOut");

  /* The drawer closes itself on the way out of a link — see the
     `onNavigate` handed to the sidebar below. */

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="flex-1 lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="hidden border-r border-line lg:sticky lg:top-0 lg:block lg:h-screen">
        <ConsoleSidebar config={config} />
      </aside>

      {open && (
        <div className="fixed inset-0 z-100 lg:hidden">
          <button
            type="button"
            aria-label={t("shell.closeNavigation")}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-feature/50 backdrop-blur-[2px]"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label={t(config.labelKey)}
            className="absolute inset-y-0 left-0 flex w-[86%] max-w-xs flex-col shadow-pop"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t("shell.closeNavigation")}
              className="absolute right-3 top-4 z-10 flex size-9 items-center justify-center rounded-md text-ink transition-colors hover:bg-canvas"
            >
              <X className="size-5" strokeWidth={1.75} aria-hidden />
            </button>

            <ConsoleSidebar config={config} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur">
          <div className="flex h-16 items-center gap-2 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label={t("shell.openNavigation")}
              aria-expanded={open}
              className="flex size-10 items-center justify-center rounded-md text-ink transition-colors hover:bg-surface lg:hidden"
            >
              <Menu className="size-5" strokeWidth={1.75} aria-hidden />
            </button>

            <form
              role="search"
              onSubmit={(event) => event.preventDefault()}
              className="relative hidden min-w-0 flex-1 sm:block sm:max-w-sm"
            >
              <label htmlFor="console-search" className="sr-only">
                {t("shell.searchLabel")}
              </label>
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-subtle"
                aria-hidden
              />
              <input
                id="console-search"
                type="search"
                placeholder={t("shell.searchPlaceholder")}
                className="h-10 w-full rounded-md border border-line bg-surface/70 pl-9 pr-3 text-sm text-ink transition-colors placeholder:text-ink-subtle hover:border-line-strong focus:border-ink focus:bg-canvas focus:outline-none"
              />
            </form>

            <div className="ml-auto flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                aria-label={t("shell.notifications")}
                className="relative flex size-10 items-center justify-center rounded-md text-ink transition-colors hover:bg-surface"
              >
                <Bell className="size-5" strokeWidth={1.75} aria-hidden />
                <span
                  aria-hidden
                  className="absolute right-2.5 top-2.5 size-1.5 rounded-full bg-accent ring-2 ring-canvas"
                />
              </button>

              <ThemeToggle />

              <span className="ml-1 hidden items-center gap-2.5 border-l border-line pl-3 sm:flex">
                <span
                  aria-hidden
                  className="flex size-8 items-center justify-center rounded-full bg-ink text-[0.6875rem] font-medium text-canvas"
                >
                  {staff ? initialsOf(name) : "—"}
                </span>
                <span className="hidden leading-tight md:block">
                  <span className="block text-sm text-ink">{name}</span>
                  <span className="block text-xs text-ink-subtle">{t(config.roleLabelKey)}</span>
                </span>
              </span>
            </div>
          </div>
        </header>

        <main id="main" className="flex-1 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <div className="mx-auto w-full max-w-[84rem]">{children}</div>
        </main>
      </div>
    </div>
  );
}
