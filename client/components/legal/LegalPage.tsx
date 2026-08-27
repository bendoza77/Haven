import { useTranslations } from "next-intl";
import Link from "next/link";
import Breadcrumb from "@/components/ui/Breadcrumb";
import Container from "@/components/ui/Container";

export type LegalSection = {
  /** Also the anchor, so the contents list and the headings cannot drift. */
  id: string;
  heading: string;
  body: React.ReactNode;
};

/**
 * The frame both legal pages share.
 *
 * Long prose is hard to navigate, so the sections index themselves into a rail
 * that follows the reader down the page. The contents are generated from the
 * same array that renders the body — there is no second list to forget to
 * update when a clause is added.
 */
export default function LegalPage({
  title,
  summary,
  updated,
  sections,
  related,
}: {
  title: string;
  summary: string;
  /** Shown as written; these documents are dated, not versioned. */
  updated: string;
  sections: LegalSection[];
  related: { label: string; href: string };
}) {
  const t = useTranslations("legal");
  const tBreadcrumb = useTranslations("breadcrumb");

  return (
    <>
      <div className="border-b border-line bg-surface">
        <Container className="py-10 lg:py-14">
          <Breadcrumb items={[{ label: tBreadcrumb("home"), href: "/" }, { label: title }]} />

          <h1 className="mt-4 max-w-3xl font-display text-4xl leading-tight tracking-tight text-ink sm:text-5xl">
            {title}
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-muted">{summary}</p>

          <p className="mt-6 text-xs uppercase tracking-[0.14em] text-ink-subtle">
            {t("lastUpdated", { date: updated })}
          </p>
        </Container>
      </div>

      <Container className="py-12 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-16">
          {/* The rail follows the reader; on small screens it sits above the
              prose as a plain list rather than being hidden entirely. */}
          <nav aria-label={t("onThisPage")} className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink-subtle">
              {t("onThisPage")}
            </p>
            <ul className="mt-4 space-y-1 border-l border-line">
              {sections.map((section, index) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="-ml-px flex gap-2.5 border-l border-transparent py-1.5 pl-4 text-sm text-ink-muted transition-colors hover:border-ink hover:text-ink"
                  >
                    <span className="tabular-nums text-ink-subtle">{index + 1}.</span>
                    {section.heading}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="min-w-0">
            {/* `scroll-mt` keeps a jumped-to heading clear of the sticky header
                rather than tucked underneath it. */}
            <div className="space-y-12">
              {sections.map((section, index) => (
                <section key={section.id} id={section.id} className="scroll-mt-28">
                  <h2 className="flex gap-3 font-display text-2xl leading-tight tracking-tight text-ink sm:text-3xl">
                    <span className="text-ink-subtle tabular-nums">{index + 1}.</span>
                    {section.heading}
                  </h2>
                  <div className="mt-4 space-y-4 text-base leading-relaxed text-ink-muted [&_a]:text-ink [&_a]:underline [&_a]:underline-offset-4 [&_li]:pl-1 [&_strong]:font-medium [&_strong]:text-ink [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
                    {section.body}
                  </div>
                </section>
              ))}
            </div>

            <div className="mt-14 flex flex-col gap-3 rounded-lg border border-line bg-surface p-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-ink-muted">{t("lookingForOther")}</p>
              <Link
                href={related.href}
                className="flex h-10 w-fit items-center justify-center rounded-md border border-line-strong bg-canvas px-5 text-sm font-medium text-ink transition-colors hover:border-ink"
              >
                {related.label}
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </>
  );
}
