import { setRequestLocale } from "next-intl/server";
import StorefrontChrome from "@/components/layout/StorefrontChrome";

/** The public shop. The console group next door draws its own frame instead. */
export default async function StorefrontLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <StorefrontChrome locale={locale}>{children}</StorefrontChrome>;
}
