import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowLeft, Check, ShieldCheck } from "lucide-react";
import { site } from "@/lib/site";

export type Highlight = { title: string; description: string };

/**
 * Frame shared by every auth route: form on the left, brand panel on the right.
 *
 * The panel is text and CSS only — no photography — so these routes have no
 * image request at all and the largest paint is the heading, drawn with the
 * fonts the layout has already loaded.
 */
export default function AuthShell({
  eyebrow,
  title,
  description,
  statement,
  highlights,
  footer,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  statement: string;
  highlights: Highlight[];
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  const t = useTranslations("authShell");

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex justify-center px-4 py-10 sm:px-6 sm:py-14 lg:px-12 lg:py-20 xl:px-20">
        <div className="w-full max-w-[26rem]">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-ink-muted transition-colors hover:text-ink"
          >
            <ArrowLeft className="size-4" strokeWidth={1.75} aria-hidden />
            {t("backToStore")}
          </Link>

          <p className="mt-9 text-xs font-medium uppercase tracking-[0.16em] text-ink-subtle">
            {eyebrow}
          </p>
          <h1 className="mt-3 font-display text-4xl leading-tight tracking-tight text-ink ka:text-3xl sm:text-5xl ka:sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">{description}</p>

          <div className="mt-8">{children}</div>

          <p className="mt-8 border-t border-line pt-6 text-sm text-ink-muted">{footer}</p>

          {/* The brand panel is desktop-only, so small screens get the same
              reassurance in a form that costs a few lines of markup. */}
          <ul className="mt-8 grid gap-3 rounded-lg border border-line bg-surface p-5 sm:grid-cols-2 lg:hidden">
            {highlights.map((item) => (
              <li key={item.title} className="flex items-start gap-2.5 text-sm text-ink-muted">
                <Check className="mt-0.5 size-4 shrink-0 text-accent" strokeWidth={2} aria-hidden />
                {item.title}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* The cell carries the colour and the panel inside it sticks, so nothing
          pale is ever left showing between the panel and the footer. */}
      <aside className="hidden bg-feature text-feature-ink lg:block">
        <div className="sticky top-20 flex min-h-[calc(100dvh-5rem)] flex-col justify-between overflow-hidden p-12 xl:p-16">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-32 -top-32 size-[34rem] rounded-full bg-accent/25 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-40 -left-24 size-[26rem] rounded-full bg-feature-ink/5 blur-3xl"
          />

          <p className="relative font-display text-2xl tracking-tight">{site.name}</p>

          <div className="relative max-w-md py-10">
            <p className="font-display text-4xl leading-[1.15] tracking-tight ka:text-3xl xl:text-5xl ka:xl:text-4xl">
              {statement}
            </p>

            <ul className="mt-10 space-y-5">
              {highlights.map((item) => (
                <li key={item.title} className="flex gap-4">
                  <span
                    aria-hidden
                    className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-feature-ink/25"
                  >
                    <Check className="size-3.5" strokeWidth={2.25} />
                  </span>
                  <span>
                    <span className="block text-sm font-medium">{item.title}</span>
                    <span className="mt-1 block text-sm leading-relaxed text-feature-ink/60">
                      {item.description}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <p className="relative flex items-center gap-2.5 border-t border-feature-ink/15 pt-6 text-xs text-feature-ink/60">
            <ShieldCheck className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
            {t("privacyNote")}
          </p>
        </div>
      </aside>
    </div>
  );
}
