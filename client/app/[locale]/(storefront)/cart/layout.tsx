import PageMessages from "@/components/layout/PageMessages";
import { CART_CLIENT } from "@/i18n/messages";

/** The bag and the order summary beside it. */
export default async function CartMessagesLayout({
  children,
  params,
}: LayoutProps<"/[locale]/cart">) {
  const { locale } = await params;

  return (
    <PageMessages locale={locale} groups={[CART_CLIENT]}>
      {children}
    </PageMessages>
  );
}
