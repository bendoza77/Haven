import PageMessages from "@/components/layout/PageMessages";
import { AUTH_CLIENT } from "@/i18n/messages";

/**
 * Sign in, register, forgot and the two token screens. The fields and their
 * validation are client-rendered; the page copy around them is not.
 */
export default async function AuthMessagesLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;

  return (
    <PageMessages locale={locale} groups={[AUTH_CLIENT]}>
      {children}
    </PageMessages>
  );
}
