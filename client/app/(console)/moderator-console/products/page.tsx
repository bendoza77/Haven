import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import ProductsScreen from "@/components/console/ProductsScreen";
import { consoles } from "@/lib/console";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("console");
  return { title: t("products.title") };
}

export default function ModeratorProductsPage() {
  return <ProductsScreen config={consoles.moderator} />;
}
