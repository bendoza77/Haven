import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Mail, MapPin, Phone } from "lucide-react";
import Container from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { footerNav, legalNav, site, socialNav } from "@/lib/site";

export default async function Footer() {
  const t = await getTranslations("footer");
  const tMeta = await getTranslations("meta");

  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <Container>
        <div className="grid gap-10 border-b border-line py-12 md:grid-cols-[1.4fr_1fr] md:items-center lg:py-14">
          <div>
            <h2 className="font-display text-2xl tracking-tight text-ink sm:text-3xl">
              {t("newsletterTitle")}
            </h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-muted">
              {t("newsletterBody")}
            </p>
          </div>
          <form className="flex w-full flex-col gap-3 sm:flex-row">
            <label htmlFor="newsletter-email" className="sr-only">
              {t("emailLabel")}
            </label>
            <input
              id="newsletter-email"
              name="email"
              type="email"
              placeholder={t("emailPlaceholder")}
              className="h-11 w-full rounded-md border border-line-strong bg-canvas px-3.5 text-sm text-ink placeholder:text-ink-subtle focus:border-ink focus:outline-none"
            />
            <Button type="button" className="sm:w-auto sm:shrink-0">
              {t("subscribe")}
            </Button>
          </form>
        </div>

        <div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.5fr_repeat(3,1fr)] lg:gap-8">
          <div className="max-w-sm">
            <Link href="/" className="font-display text-2xl tracking-tight text-ink">
              {site.name}
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              {tMeta("description")}
            </p>
            <ul className="mt-6 space-y-2.5 text-sm text-ink-muted">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-ink-subtle" aria-hidden />
                {t("address")}
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="size-4 shrink-0 text-ink-subtle" aria-hidden />
                <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="hover:text-ink">
                  {site.phone}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="size-4 shrink-0 text-ink-subtle" aria-hidden />
                <a href={`mailto:${site.email}`} className="hover:text-ink">
                  {site.email}
                </a>
              </li>
            </ul>
          </div>

          {footerNav.map((column) => (
            <nav key={column.key} aria-label={t(`columns.${column.key}`)}>
              <h3 className="text-xs font-medium uppercase tracking-[0.16em] text-ink">
                {t(`columns.${column.key}`)}
              </h3>
              <ul className="mt-5 space-y-3">
                {column.links.map((link) => (
                  <li key={link.key}>
                    <Link
                      href={link.href}
                      className="text-sm text-ink-muted transition-colors hover:text-ink"
                    >
                      {t(`links.${link.key}`)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="flex flex-col-reverse items-center gap-6 border-t border-line py-8 sm:flex-row sm:justify-between">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-5">
            <p className="text-xs text-ink-subtle">
              {/* As a string: a number placeholder would be group-separated into
                  "2,026" by the locale number format. */}
              {t("rights", { year: String(new Date().getFullYear()), name: site.name })}
            </p>
            <ul className="flex items-center gap-5">
              {legalNav.map(({ key, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-xs text-ink-muted transition-colors hover:text-ink"
                  >
                    {t(`legal.${key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center gap-6">
            <p className="hidden text-xs text-ink-subtle sm:block">{t("payments")}</p>
            <ul className="flex items-center gap-5">
              {socialNav.map(({ key, href }) => (
                <li key={key}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-ink-muted transition-colors hover:text-ink"
                  >
                    {t(`social.${key}`)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </footer>
  );
}
