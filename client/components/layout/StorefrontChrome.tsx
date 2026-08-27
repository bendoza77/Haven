import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

/**
 * The shop's frame — announcement bar, header, page, footer.
 *
 * It lives in a component rather than only in the `(storefront)` layout
 * because the 404 has to stay at the root of `app/` to catch unmatched
 * URLs, which puts it outside that layout but still inside the shop.
 */
export default function StorefrontChrome({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  );
}
