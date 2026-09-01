import PageMessages from "@/components/layout/PageMessages";
import { PRODUCT_CLIENT } from "@/i18n/messages";

/** A product page. The reviews are written and re-read in the browser. */
export default async function ProductMessagesLayout({
  children,
  params,
}: LayoutProps<"/[locale]/product">) {
  const { locale } = await params;

  return (
    <PageMessages locale={locale} groups={[PRODUCT_CLIENT]}>
      {children}
    </PageMessages>
  );
}
