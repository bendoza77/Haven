import PageMessages from "@/components/layout/PageMessages";
import { ACCOUNT_CLIENT } from "@/i18n/messages";

/**
 * The profile, its orders, its addresses and the two-step setting — the whole
 * screen is drawn in the browser from the signed-in account.
 */
export default async function AccountMessagesLayout({
  children,
  params,
}: LayoutProps<"/[locale]/account">) {
  const { locale } = await params;

  return (
    <PageMessages locale={locale} groups={[ACCOUNT_CLIENT]}>
      {children}
    </PageMessages>
  );
}
