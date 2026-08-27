"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Check, Globe } from "lucide-react";
import { locales, localeLabels, type Locale } from "@/i18n/config";
import { applyDocumentLocale, writeLocaleCookie } from "@/lib/locale";
import { cn } from "@/lib/utils";

/**
 * Switching language is a server concern here: most of the shop renders on
 * the server, so the new dictionary arrives with a refresh rather than from a
 * client-side store. `useTransition` keeps the old text on screen — and
 * interactive — while that round-trip is in flight, instead of blanking the
 * page. The `lang` attribute is set immediately so the Georgian font and the
 * :lang(ka) type rules apply to the incoming markup, not one paint later.
 */
function useLocaleSwitch() {
  const router = useRouter();
  const active = useLocale() as Locale;
  const [pending, startTransition] = useTransition();

  const switchTo = (next: Locale) => {
    if (next === active) return;

    writeLocaleCookie(next);
    applyDocumentLocale(next);

    startTransition(() => {
      router.refresh();
    });
  };

  return { active, pending, switchTo };
}

const iconAction =
  "flex size-10 items-center justify-center rounded-md text-ink transition-colors hover:bg-surface";

/**
 * Header control. Two languages means a toggle rather than a menu: one press
 * is the whole interaction, and the label always names the language you would
 * be switching *to*.
 */
export function LanguageToggle({ className }: { className?: string }) {
  const t = useTranslations("language");
  const { active, pending, switchTo } = useLocaleSwitch();

  const next = active === "en" ? "ka" : "en";

  return (
    <button
      type="button"
      onClick={() => switchTo(next)}
      disabled={pending}
      aria-busy={pending}
      className={cn(iconAction, "gap-1.5 px-2 sm:w-auto", pending && "opacity-60", className)}
    >
      <Globe className="size-5 shrink-0" strokeWidth={1.75} aria-hidden />
      {/* The code is the affordance on a narrow header; the full name would
          wrap the row on small screens. */}
      <span className="text-xs font-medium tabular-nums" aria-hidden>
        {localeLabels[active].short}
      </span>
      <span className="sr-only">{t("switchTo", { language: localeLabels[next].native })}</span>
    </button>
  );
}

/**
 * Drawer control: both languages named in their own script, so the choice is
 * legible to someone who cannot read the current one.
 */
export function LanguageChoice() {
  const t = useTranslations("language");
  const { active, pending, switchTo } = useLocaleSwitch();

  return (
    <div
      role="radiogroup"
      aria-label={t("label")}
      className={cn("flex gap-1 rounded-md bg-surface p-1", pending && "opacity-60")}
    >
      {locales.map((locale) => {
        const current = locale === active;

        return (
          <button
            key={locale}
            type="button"
            role="radio"
            aria-checked={current}
            disabled={pending}
            onClick={() => switchTo(locale)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-sm px-3 py-2 text-sm transition-colors",
              current
                ? "bg-canvas font-medium text-ink shadow-card"
                : "text-ink-muted hover:text-ink",
            )}
          >
            {current ? (
              <Check className="size-4" strokeWidth={1.75} aria-hidden />
            ) : (
              <Globe className="size-4" strokeWidth={1.75} aria-hidden />
            )}
            {localeLabels[locale].native}
          </button>
        );
      })}
    </div>
  );
}
