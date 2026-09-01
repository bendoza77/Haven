import PageMessages from "@/components/layout/PageMessages";
import { BROWSE_CLIENT } from "@/i18n/messages";

/** A category grid. Only the sort control is client-rendered. */
export default async function CategoryMessagesLayout({
  children,
  params,
}: LayoutProps<"/[locale]/category">) {
  const { locale } = await params;

  return (
    <PageMessages locale={locale} groups={[BROWSE_CLIENT]}>
      {children}
    </PageMessages>
  );
}
