import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { pageMetadata } from "@/lib/seo";
import LegalPage, { type LegalSection } from "@/components/legal/LegalPage";
import { legalTags, legalValues } from "@/components/legal/richText";

export async function generateMetadata(props: PageProps<"/[locale]/privacy">): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "privacy" });

  return pageMetadata({
    locale,
    path: "/privacy",
    title: t("title"),
    description: t("metaDescription"),
  });
}

const SECTION_IDS = [
  "who",
  "collect",
  "payment",
  "why",
  "sharing",
  "cookies",
  "keeping",
  "rights",
  "security",
  "changes",
] as const;

export default async function PrivacyPage({ params }: PageProps<"/[locale]/privacy">) {
  const { locale } = await params;

  /* `setRequestLocale` is what keeps this page prerenderable. Without it
     next-intl resolves the locale from `requestLocale`, which is a dynamic
     read, and Next gives up on static generation for the whole route — so a
     page whose text changes only when the dictionary does was being rebuilt on
     every request. Every page that can be built ahead of time calls it; the
     difference is a cache hit at the edge instead of a function invocation. */
  setRequestLocale(locale);

  const t = await getTranslations("privacy");
  const tFooter = await getTranslations("footer");

  const values = { ...legalValues, address: tFooter("address") };

  const sections: LegalSection[] = SECTION_IDS.map((id) => ({
    id,
    heading: t(`sections.${id}.heading`),
    body: t.rich(`sections.${id}.body`, { ...legalTags, ...values }),
  }));

  return (
    <LegalPage
      title={t("title")}
      summary={t("summary")}
      updated={t("updated")}
      sections={sections}
      related={{ label: t("relatedLabel"), href: "/terms" }}
    />
  );
}
