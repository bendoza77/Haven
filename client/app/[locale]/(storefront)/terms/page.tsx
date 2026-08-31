import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import LegalPage, { type LegalSection } from "@/components/legal/LegalPage";
import { legalTags, legalValues } from "@/components/legal/richText";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("terms");
  return { title: t("title"), description: t("metaDescription") };
}

/* Order and anchor ids only. Each id is also the message key for that clause,
   so a section cannot be renumbered in one language and not the other. */
const SECTION_IDS = [
  "about",
  "account",
  "orders",
  "prices",
  "delivery",
  "returns",
  "reviews",
  "liability",
  "changes",
] as const;

export default async function TermsPage() {
  const t = await getTranslations("terms");
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
      related={{ label: t("relatedLabel"), href: "/privacy" }}
    />
  );
}
