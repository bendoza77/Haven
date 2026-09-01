import PageMessages from "@/components/layout/PageMessages";
import { BROWSE_CLIENT } from "@/i18n/messages";

/** The shop grid. Only the sort control is client-rendered. */
export default async function ShopMessagesLayout({
  children,
  params,
}: LayoutProps<"/[locale]/shop">) {
  const { locale } = await params;

  return (
    <PageMessages locale={locale} groups={[BROWSE_CLIENT]}>
      {children}
    </PageMessages>
  );
}
