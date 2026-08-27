import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Search } from "lucide-react";
import AuthNav from "@/components/auth/AuthNav";
import HeaderActions from "@/components/layout/HeaderActions";
import MobileMenu from "@/components/layout/MobileMenu";
import NavLink from "@/components/layout/NavLink";
import Container from "@/components/ui/Container";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { mainNav, site } from "@/lib/site";

const iconAction =
  "flex size-10 items-center justify-center rounded-md text-ink transition-colors hover:bg-surface";

export default async function Header() {
  const t = await getTranslations("header");
  const tNav = await getTranslations("nav");

  return (
    <>
      <p className="bg-feature px-4 py-2.5 text-center text-xs tracking-wide text-feature-ink">
        {t("announcement")}
      </p>

      {/* Solid background on purpose: a backdrop-filter here would become the
          containing block for the mobile drawer's fixed overlay. */}
      <header className="sticky top-0 z-50 border-b border-line bg-canvas">
        <Container>
          <div className="flex h-16 items-center gap-3 lg:h-20 lg:gap-8">
            <MobileMenu />

            <Link
              href="/"
              className="font-display text-2xl leading-none tracking-tight text-ink lg:text-[1.75rem]"
            >
              {site.name}
            </Link>

            <nav aria-label={t("mainNavLabel")} className="hidden lg:block">
              <ul className="flex items-center gap-7">
                {mainNav.map((item) => (
                  <li key={item.key}>
                    <NavLink href={item.href}>{tNav(item.key)}</NavLink>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="ml-auto flex items-center gap-1 sm:gap-2">
              <form action="/search" role="search" className="relative hidden xl:block">
                <label htmlFor="header-search" className="sr-only">
                  {t("searchProducts")}
                </label>
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-subtle"
                  aria-hidden
                />
                <input
                  id="header-search"
                  name="q"
                  type="search"
                  placeholder={t("searchPlaceholder")}
                  className="h-10 w-56 rounded-md border border-line bg-surface/70 pl-9 pr-3 text-sm text-ink transition-colors placeholder:text-ink-subtle hover:border-line-strong focus:border-ink focus:bg-canvas focus:outline-none"
                />
              </form>

              <Link
                href="/search"
                aria-label={t("searchProducts")}
                className={`${iconAction} xl:hidden`}
              >
                <Search className="size-5" strokeWidth={1.75} aria-hidden />
              </Link>

              {/* Sits next to the theme control: both are document-level
                  preferences, and pairing them keeps the header row short. */}
              <LanguageToggle className="hidden sm:flex" />

              <ThemeToggle />

              <HeaderActions />

              <div className="ml-2 hidden items-center gap-2 lg:flex">
                <AuthNav />
              </div>
            </div>
          </div>
        </Container>
      </header>
    </>
  );
}
