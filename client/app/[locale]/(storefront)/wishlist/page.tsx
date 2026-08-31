import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import AccountCount from "@/components/layout/AccountCount";
import WishlistGrid from "@/components/product/WishlistGrid";
import Container from "@/components/ui/Container";
import PageHeader from "@/components/ui/PageHeader";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("wishlist");
  return { title: t("title"), description: t("metaDescription") };
}

export default async function WishlistPage() {
  const t = await getTranslations("wishlist");
  const tBreadcrumb = await getTranslations("breadcrumb");

  return (
    <>
      <PageHeader
        breadcrumb={[
          { label: tBreadcrumb("home"), href: "/" },
          { label: tBreadcrumb("wishlist") },
        ]}
        title={t("title")}
        description={t("intro")}
        meta={<AccountCount of="wishlist" />}
      />

      <Container className="py-10 lg:py-14">
        <WishlistGrid />
      </Container>
    </>
  );
}
