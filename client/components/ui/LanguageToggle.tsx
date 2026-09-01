"use client";

import { Suspense, useCallback, useEffect, useMemo, useTransition } from "react";
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
 * What was still cold is the payload itself: a button has no href, so Next had
 * nothing to prefetch and every switch began with a round trip. The effect
 * below warms the sibling route while the page is idle, which is what makes
 * the change land in a frame or two rather than after a visible pause.
 */
function useLocaleSwitch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = useLocale() as Locale;
  const [pending, startTransition] = useTransition();

  /* `pathname` here has no locale on it — it is the route as the app names it
     — so the same address is simply re-asked for in the other language. The
     query string is carried across by hand: a shopper switching language half
     way down a filtered, sorted, paginated shop expects to still be looking at
     it. */
  const href = useMemo(() => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  const others = useMemo(() => locales.filter((locale) => locale !== active), [active]);

  /**
   * Warms the other language before it is asked for.
   *
   * Next prefetches the links it can see, but the language control is a button
   * — there is no href for the router to notice — so the switch was the one
   * navigation on the page that always started cold: a round trip for the
   * route's payload while the reader watched the old language sit there. The
   * other locale's copy of the current route is small and already rendered
   * upstream, so fetching it up front makes the switch land in a frame or two.
   *
   * In an idle callback because it is speculative work: it must not compete
   * with hydration or with anything the reader actually asked for.
   */
  useEffect(() => {
    /* `requestIdleCallback` is still unimplemented in Safari, so a short timer
       stands in for it there — the point is only to be after hydration, not to
       be precise. */
    const supported = typeof window.requestIdleCallback === "function";

    const handle = supported
      ? window.requestIdleCallback(() => {
          for (const locale of others) router.prefetch(href, { locale });
        })
      : window.setTimeout(() => {
          for (const locale of others) router.prefetch(href, { locale });
        }, 300);

    return () => {
      if (supported) window.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
    };
  }, [href, others, router]);

  const switchTo = useCallback(
    (next: Locale) => {
      if (next === active) return;

      /* Set by hand and immediately: `lang` drives the Georgian font stack and
         the `:lang(ka)` type rules, and waiting for the new document to commit
         would show one paint of Georgian in Latin metrics. */
      applyDocumentLocale(next);

      startTransition(() => {
        router.replace(href, { locale: next });
      });
    },
    [active, href, router],
  );

  return { active, pending, switchTo };
}

const iconAction =
  "flex size-10 items-center justify-center rounded-md text-ink transition-colors hover:bg-surface";

function LanguageToggleFallback({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(iconAction, "gap-1.5 px-2 opacity-60 sm:w-auto", className)}
    >
      <Globe className="size-5 shrink-0" strokeWidth={1.75} />
      <span className="text-xs font-medium tabular-nums">…</span>
    </span>
  );
}

function LanguageChoiceFallback() {
  return (
    <div aria-hidden className="flex gap-1 rounded-md bg-surface p-1 opacity-60">
      {locales.map((locale) => (
        <span
          key={locale}
          className="flex flex-1 items-center justify-center gap-2 rounded-sm px-3 py-2 text-sm text-ink-muted"
        >
          <Globe className="size-4" strokeWidth={1.75} />
          {localeLabels[locale].native}
        </span>
      ))}
    </div>
  );
}

/**
 * Header control. Two languages means a toggle rather than a menu: one press
 * is the whole interaction, and the label always names the language you would
 * be switching *to*.
 */
export function LanguageToggle({ className }: { className?: string }) {
  return (
    <Suspense fallback={<LanguageToggleFallback className={className} />}>
      <LanguageToggleInner className={className} />
    </Suspense>
  );
}

function LanguageToggleInner({ className }: { className?: string }) {
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
  return (
    <Suspense fallback={<LanguageChoiceFallback />}>
      <LanguageChoiceInner />
    </Suspense>
  );
}

function LanguageChoiceInner() {
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
