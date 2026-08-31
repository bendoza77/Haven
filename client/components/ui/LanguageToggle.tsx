"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Check, Globe } from "lucide-react";
import { locales, localeLabels, type Locale } from "@/i18n/config";
import { usePathname, useRouter } from "@/i18n/navigation";
import { applyDocumentLocale } from "@/lib/locale";
import { cn } from "@/lib/utils";

/**
 * Switching language is a navigation now, not a refresh.
 *
 * It used to write a cookie and call `router.refresh()`, which threw away the
 * whole payload for the current route and asked the server to build it again:
 * every product query on the page re-ran uncached, and the entire dictionary
 * was re-serialised — 118 kB of it in Georgian — before a single word changed
 * on screen. The locale was in a cookie, so Next had nothing it could cache
 * per language and did the same work on every switch.
 *
 * Each language now has its own URL, so this is an ordinary client navigation
 * to a sibling route. Next has usually prefetched it already, the data behind
 * it is cached, and only the messages that page's client components need cross
 * the wire. `useTransition` keeps the current text on screen and interactive
 * while that happens rather than blanking the page.
 *
 * The `lang` attribute is still set by hand and immediately: it drives the
 * Georgian font stack and the `:lang(ka)` type rules, and waiting for the new
 * document to commit would show one paint of Georgian in Latin metrics.
 */
function useLocaleSwitch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = useLocale() as Locale;
  const [pending, startTransition] = useTransition();

  const switchTo = (next: Locale) => {
    if (next === active) return;

    applyDocumentLocale(next);

    /* `pathname` here has no locale on it — it is the route as the app names
       it — so the same address is simply re-asked for in the other language.
       The query string is carried across by hand: a shopper switching language
       half way down a filtered, sorted, paginated shop expects to still be
       looking at it. */
    const query = searchParams.toString();

    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, { locale: next });
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
