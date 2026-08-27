import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import ProductEditor from "@/components/console/ProductEditor";
import { consoles } from "@/lib/console";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("console");
  return { title: t("meta.editProduct") };
}

export default async function AdminEditProductPage(
  props: PageProps<"/admin-console/products/[id]">,
) {
  const { id } = await props.params;

  return <ProductEditor config={consoles.admin} id={id} />;
}
