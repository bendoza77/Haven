import PageMessages from "@/components/layout/PageMessages";
import { CHECKOUT_CLIENT } from "@/i18n/messages";

/** The checkout flow: address form, delivery choice, order summary. */
export default async function CheckoutMessagesLayout({
  children,
  params,
}: LayoutProps<"/[locale]/checkout">) {
  const { locale } = await params;

  return (
    <PageMessages locale={locale} groups={[CHECKOUT_CLIENT]}>
      {children}
    </PageMessages>
  );
}
