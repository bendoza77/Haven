import { NextIntlClientProvider } from "next-intl";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { STOREFRONT_CLIENT, clientMessages } from "@/i18n/messages";

/**
 * The shop's frame — announcement bar, header, page, footer.
 *
 * It lives in a component rather than only in the `(storefront)` layout
 * because the 404 has to stay at the root of the locale segment to catch
 * unmatched URLs, which puts it outside that layout but still inside the shop.
 *
 * It is also where the browser is given its dictionary. The provider wraps
 * `children` rather than only the header and footer, so a page's own client
 * components share the one the frame already needs — the header's controls, a
 * product card's save and add buttons, the theme and language toggles. A page
 * with a heavier client surface than that (the checkout, the profile, the
 * reviews) nests its own provider with the extra namespaces, and pays for them
 * on that page alone.
 */
export default async function StorefrontChrome({
  locale,
  children,
  extra = [],
}: {
  /** Omitted only by the not-found boundary, which has no segment to read. */
  locale?: string;
  children: React.ReactNode;
  /** Extra namespace groups this page's client components need. */
  extra?: readonly (readonly string[])[];
}) {
  const messages = await clientMessages(locale, STOREFRONT_CLIENT, ...extra);

  return (
    <NextIntlClientProvider messages={messages}>
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
    </NextIntlClientProvider>
  );
}
