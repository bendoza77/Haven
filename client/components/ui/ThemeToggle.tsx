"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Monitor, Moon, Sun } from "lucide-react";
import {
  getPreferenceSnapshot,
  getResolvedSnapshot,
  getServerPreferenceSnapshot,
  getServerResolvedSnapshot,
  setTheme,
  subscribeToTheme,
  themeOptions,
} from "@/lib/theme";
import { cn } from "@/lib/utils";

const usePreference = () =>
  useSyncExternalStore(subscribeToTheme, getPreferenceSnapshot, getServerPreferenceSnapshot);

const useResolved = () =>
  useSyncExternalStore(subscribeToTheme, getResolvedSnapshot, getServerResolvedSnapshot);

const iconAction =
  "flex size-10 items-center justify-center rounded-md text-ink transition-colors hover:bg-surface";

/** Header control: one press swaps the theme, whichever way round it is. */
export function ThemeToggle({ className }: { className?: string }) {
  const t = useTranslations("theme");
  const resolved = useResolved();

  return (
    <button
      type="button"
      onClick={() => setTheme(resolved === "dark" ? "light" : "dark")}
      className={cn(iconAction, className)}
    >
      {/* Swapped by CSS rather than by state, so the right icon is on screen
          before React hydrates — the same reason the theme itself is. */}
      <Moon className="size-5 dark:hidden" strokeWidth={1.75} aria-hidden />
      <Sun className="hidden size-5 dark:block" strokeWidth={1.75} aria-hidden />
      <span className="sr-only">
        {resolved === "dark" ? t("switchToLight") : t("switchToDark")}
      </span>
    </button>
  );
}

const icons = { system: Monitor, light: Sun, dark: Moon } as const;

/** Drawer control: the full choice, including handing it back to the system. */
export function ThemeChoice() {
  const t = useTranslations("theme");
  const preference = usePreference();

  return (
    <div role="radiogroup" aria-label={t("label")} className="flex gap-1 rounded-md bg-surface p-1">
      {themeOptions.map((option) => {
        const Icon = icons[option.value];
        const active = preference === option.value;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(option.value)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-sm px-3 py-2 text-sm transition-colors",
              active
                ? "bg-canvas font-medium text-ink shadow-card"
                : "text-ink-muted hover:text-ink",
            )}
          >
            <Icon className="size-4" strokeWidth={1.75} aria-hidden />
            {t(option.value)}
          </button>
        );
      })}
    </div>
  );
}
