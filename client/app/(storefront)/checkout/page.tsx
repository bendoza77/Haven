import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import CheckoutFlow from "@/components/cart/CheckoutFlow";
import Container from "@/components/ui/Container";
import PageHeader from "@/components/ui/PageHeader";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("checkout");
  return { title: t("title"), description: t("metaDescription") };
}

/* The flow is one client component: the bag, the address and the button that
   places the order all read the signed-in account. */
export default async function CheckoutPage() {
  const t = await getTranslations("checkout");
  const tBreadcrumb = await getTranslations("breadcrumb");

  return (
    <>
      <PageHeader
        breadcrumb={[
          { label: tBreadcrumb("home"), href: "/" },
          { label: tBreadcrumb("cart"), href: "/cart" },
          { label: t("title") },
        ]}
        title={t("title")}
        description={t("intro")}
      />

      <Container className="py-10 lg:py-14">
        <CheckoutFlow />
      </Container>
    </>
  );
}
