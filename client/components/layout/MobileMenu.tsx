"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import AuthNav from "@/components/auth/AuthNav";
import { ThemeChoice } from "@/components/ui/ThemeToggle";
import { LanguageChoice } from "@/components/ui/LanguageToggle";
import { categories } from "@/data/catalog";
import { mainNav, site } from "@/lib/site";

const accountLinks = [
  { key: "myAccount", href: "/account" },
  { key: "wishlist", href: "/wishlist" },
  { key: "cart", href: "/cart" },
] as const;

/** Slide-in navigation for small screens. */
export default function MobileMenu() {
  const t = useTranslations("header");
  const tNav = useTranslations("nav");
  const tCat = useTranslations("categories");
  const [open, setOpen] = useState(false);

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
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("openMenu")}
        aria-expanded={open}
        className="flex size-10 items-center justify-center rounded-md text-ink transition-colors hover:bg-surface lg:hidden"
      >
        <Menu className="size-5" aria-hidden />
      </button>

      {open && (
        <div className="fixed inset-0 z-100 lg:hidden">
          <button
            type="button"
            aria-label={t("closeMenu")}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-feature/50 backdrop-blur-[2px]"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label={t("siteNavLabel")}
            className="absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col bg-canvas shadow-pop"
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <Link href="/" className="font-display text-2xl tracking-tight text-ink">
                {site.name}
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t("closeMenu")}
                className="flex size-10 items-center justify-center rounded-md text-ink transition-colors hover:bg-surface"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>

            {/* Any link inside the drawer closes it on the way out. */}
            <nav
              className="flex-1 overflow-y-auto px-5 py-6"
              aria-label={t("mobileNavLabel")}
              onClick={() => setOpen(false)}
            >
              <ul className="space-y-1">
                {mainNav.map((item) => (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      className="block rounded-md px-2 py-3 font-display text-2xl tracking-tight text-ink transition-colors hover:bg-surface"
                    >
                      {tNav(item.key)}
                    </Link>
                  </li>
                ))}
              </ul>

              <p className="mb-2 mt-8 px-2 text-xs font-medium uppercase tracking-[0.16em] text-ink-subtle">
                {t("menuCategories")}
              </p>
              <ul className="space-y-0.5">
                {categories.map((category) => (
                  <li key={category.slug}>
                    <Link
                      href={`/category/${category.slug}`}
                      className="block rounded-md px-2 py-2.5 text-sm text-ink-muted transition-colors hover:bg-surface hover:text-ink"
                    >
                      {tCat(`${category.slug}.name`)}
                    </Link>
                  </li>
                ))}
              </ul>

              <p className="mb-2 mt-8 px-2 text-xs font-medium uppercase tracking-[0.16em] text-ink-subtle">
                {t("menuAccount")}
              </p>
              <ul className="space-y-0.5">
                {accountLinks.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="block rounded-md px-2 py-2.5 text-sm text-ink-muted transition-colors hover:bg-surface hover:text-ink"
                    >
                      {t(item.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="border-t border-line px-5 py-5">
              {/* The drawer is the only place a phone can reach the full
                  language names, so it gets the labelled choice rather than
                  the header's two-letter toggle. */}
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-ink-subtle">
                {t("menuLanguage")}
              </p>
              <LanguageChoice />

              <p className="mb-2 mt-5 text-xs font-medium uppercase tracking-[0.16em] text-ink-subtle">
                {t("menuTheme")}
              </p>
              <ThemeChoice />

              <div
                className="mt-5 flex items-center gap-3 [&>*]:flex-1"
                onClick={() => setOpen(false)}
              >
                <AuthNav />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
