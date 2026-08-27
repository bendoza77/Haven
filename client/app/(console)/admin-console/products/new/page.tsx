import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import ConsoleHeader from "@/components/console/ConsoleHeader";
import ProductForm from "@/components/console/ProductForm";
import { consoles } from "@/lib/console";

const config = consoles.admin;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("console");
  return { title: t("products.newTitle"), description: t("meta.newProductDescription") };
}

export default async function AdminNewProductPage() {
  const t = await getTranslations("console");

  return (
    <div className="space-y-8">
      <ConsoleHeader
        breadcrumb={[
          { label: t("breadcrumb.console"), href: config.base },
          { label: t("breadcrumb.products"), href: `${config.base}/products` },
          { label: t("breadcrumb.new") },
        ]}
        title={t("products.newTitle")}
        description={t("products.newDescriptionAdmin")}
      />

      <ProductForm config={config} submitLabel={t("actions.createProduct")} />
    </div>
  );
}
