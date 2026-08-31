import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import CartClient from "@/components/cart/CartClient";
import AccountCount from "@/components/layout/AccountCount";
import Container from "@/components/ui/Container";
import PageHeader from "@/components/ui/PageHeader";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("cart");
  const tBreadcrumb = await getTranslations("breadcrumb");
  return { title: tBreadcrumb("cart"), description: t("metaDescription") };
}

export default async function CartPage() {
  const t = await getTranslations("cart");
  const tBreadcrumb = await getTranslations("breadcrumb");

  return (
    <>
      <PageHeader
        breadcrumb={[
          { label: tBreadcrumb("home"), href: "/" },
          { label: tBreadcrumb("cart") },
        ]}
        title={t("title")}
        meta={<AccountCount of="cart" />}
      />

      <Container className="py-10 lg:py-14">
        <CartClient />
      </Container>
    </>
  );
}
