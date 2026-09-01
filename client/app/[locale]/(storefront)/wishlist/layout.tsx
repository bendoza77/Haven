import PageMessages from "@/components/layout/PageMessages";
import { WISHLIST_CLIENT } from "@/i18n/messages";

/** The saved list, drawn in the browser from the signed-in account. */
export default async function WishlistMessagesLayout({
  children,
  params,
}: LayoutProps<"/[locale]/wishlist">) {
  const { locale } = await params;

  return (
    <PageMessages locale={locale} groups={[WISHLIST_CLIENT]}>
      {children}
    </PageMessages>
  );
}
