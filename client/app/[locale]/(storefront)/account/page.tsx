import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import AccountClient from "@/components/account/AccountClient";
import Container from "@/components/ui/Container";
import PageHeader from "@/components/ui/PageHeader";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  const tBreadcrumb = await getTranslations("breadcrumb");
  return { title: tBreadcrumb("account"), description: t("metaDescription") };
}

const tabs = ["profile", "orders", "addresses", "settings"] as const;
type TabId = (typeof tabs)[number];

export default async function AccountPage(props: PageProps<"/[locale]/account">) {
  const t = await getTranslations("account");
  const tBreadcrumb = await getTranslations("breadcrumb");

  const params = await props.searchParams;
  const raw = params.tab;
  const requested = Array.isArray(raw) ? raw[0] : raw;
  const tab: TabId = tabs.includes(requested as TabId) ? (requested as TabId) : "profile";

  return (
    <>
      <PageHeader
        breadcrumb={[
          { label: tBreadcrumb("home"), href: "/" },
          { label: tBreadcrumb("account") },
        ]}
        title={t("title")}
        description={t("intro")}
      />

      <Container className="py-10 lg:py-14">
        <AccountClient tab={tab} />
      </Container>
    </>
  );
}
