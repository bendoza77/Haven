import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import ProductsScreen from "@/components/console/ProductsScreen";
import { consoles } from "@/lib/console";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("console");
  return { title: t("products.title"), description: t("meta.productsDescription") };
}

export default function AdminProductsPage() {
  return <ProductsScreen config={consoles.admin} />;
}
