import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import LegalPage, { type LegalSection } from "@/components/legal/LegalPage";
import { legalTags, legalValues } from "@/components/legal/richText";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("privacy");
  return { title: t("title"), description: t("metaDescription") };
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

export default async function PrivacyPage() {
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
