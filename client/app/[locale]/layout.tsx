import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  Geist,
  Instrument_Serif,
  Noto_Sans_Georgian,
  Noto_Serif_Georgian,
} from "next/font/google";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { AuthProvider } from "@/context/AuthContext";
import { locales, type Locale } from "@/i18n/config";
import { routing } from "@/i18n/routing";
import { absoluteUrl, alternates } from "@/lib/seo";
import { site, siteUrl } from "@/lib/site";
import { themeScript } from "@/lib/theme";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

/* Neither Geist nor Instrument Serif ships a Georgian (მხედრული) glyph set, so
   Georgian text in them falls back to whatever the OS offers — different metrics
   on every machine, and tofu on some. These two carry the script properly.

   `preload: false` is the difference between loading them and loading them for
   everybody: preloading is per-page, and an English page has no Georgian on it
   to set. Left on, every English visitor fetched two font files they would
   never draw a glyph from. They are still declared in the stack, so Georgian
   text fetches them the moment there is any. */
const notoSansGeorgian = Noto_Sans_Georgian({
  variable: "--font-georgian-sans",
  subsets: ["georgian"],
  display: "swap",
  preload: false,
});

const notoSerifGeorgian = Noto_Serif_Georgian({
  variable: "--font-georgian-serif",
  weight: "400",
  subsets: ["georgian"],
  display: "swap",
  preload: false,
});

/**
 * Both languages are known ahead of time, so both shells are built at compile
 * time rather than on the first request that asks for one.
 */
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata(props: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) return {};

  const t = await getTranslations({ locale, namespace: "meta" });
  const title = `${site.name} — ${t("tagline")}`;

  return {
    /* Makes every relative URL in any page's metadata resolve to an absolute
       one. Without it Next emits relative canonicals and Open Graph URLs,
       which crawlers and link unfurlers both ignore. */
    metadataBase: new URL(siteUrl),
    title: {
      default: title,
      template: `%s · ${site.name}`,
    },
    description: t("description"),
    applicationName: site.name,
    alternates: alternates(locale, "/"),
    openGraph: {
      type: "website",
      siteName: site.name,
      locale,
      url: absoluteUrl(locale, "/"),
      title,
      description: t("description"),
    },
    twitter: { card: "summary_large_image", title, description: t("description") },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
    formatDetection: { telephone: false },
  };
}

/**
 * The root layout owns everything the document needs and nothing a screen
 * does: the two segment groups below it render very different shells —
 * `(storefront)` the header and footer, `(console)` the staff sidebar — so
 * neither is assumed here.
 *
 * There is no `NextIntlClientProvider` at this level on purpose. A provider
 * here would have to carry the messages of every screen under it, which is
 * how the whole dictionary ended up in every document; each group declares
 * its own, and pays for its own.
 */
export default async function RootLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) notFound();

  /* Tells next-intl which dictionary this render is for, without reading a
     cookie or a header — which is what lets the pages below be prerendered. */
  setRequestLocale(locale);

  const t = await getTranslations("a11y");

  return (
    <html
      lang={locale}
      // The theme attribute is written by the script below before React sees
      // the document, so the server markup is expected to differ here.
      suppressHydrationWarning
      className={`${geistSans.variable} ${instrumentSerif.variable} ${notoSansGeorgian.variable} ${notoSerifGeorgian.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-200 focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-canvas"
        >
          {t("skipToContent")}
        </a>
        <AuthProvider>{children}</AuthProvider>
        <SiteStructuredData locale={locale} />
      </body>
    </html>
  );
}

/**
 * Who the site is and how to search it, in the vocabulary a crawler reads.
 *
 * Two graphs only, both of which are plainly true of this deployment: the shop
 * as an Organization, and the site itself with the search URL it really
 * serves. Nothing about ratings, prices or availability is asserted here — that
 * belongs on a product page, where there is an actual product to describe, and
 * inventing it site-wide is the kind of structured data that earns a manual
 * penalty rather than a rich result.
 */
function SiteStructuredData({ locale }: { locale: Locale }) {
  const home = absoluteUrl(locale, "/");

  const graph = [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: site.name,
      url: siteUrl,
      email: site.email,
      telephone: site.phone,
      logo: `${siteUrl}/icon.svg`,
      sameAs: ["https://www.instagram.com", "https://www.pinterest.com", "https://www.youtube.com"],
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      name: site.name,
      url: home,
      inLanguage: locale,
      publisher: { "@id": `${siteUrl}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${absoluteUrl(locale, "/search")}?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  ];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }),
      }}
    />
  );
}
