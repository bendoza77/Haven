import type { Metadata } from "next";
import {
  Geist,
  Instrument_Serif,
  Noto_Sans_Georgian,
  Noto_Serif_Georgian,
} from "next/font/google";
import { getLocale, getTranslations } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { AuthProvider } from "@/context/AuthContext";
import { site } from "@/lib/site";
import { themeScript } from "@/lib/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  weight: "400",
  subsets: ["latin"],
});

/* Neither Geist nor Instrument Serif ships a Georgian (მხედრული) glyph set, so
   Georgian text in them falls back to whatever the OS offers — different metrics
   on every machine, and tofu on some. These two carry the script properly and
   are loaded in both languages so switching never waits on a font. */
const notoSansGeorgian = Noto_Sans_Georgian({
  variable: "--font-georgian-sans",
  subsets: ["georgian"],
});

const notoSerifGeorgian = Noto_Serif_Georgian({
  variable: "--font-georgian-serif",
  weight: "400",
  subsets: ["georgian"],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");

  return {
    title: {
      default: `${site.name} — ${t("tagline")}`,
      template: `%s · ${site.name}`,
    },
    description: t("description"),
  };
}

/**
 * The root layout owns everything the document needs and nothing a screen
 * does: the two segment groups below it render very different shells —
 * `(storefront)` the header and footer, `(console)` the staff sidebar — so
 * neither is assumed here.
 */
export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Resolved from the cookie (falling back to Accept-Language) in
  // i18n/request.ts, so the first paint is already in the right language.
  const locale = await getLocale();
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
        <NextIntlClientProvider>
          <AuthProvider>{children}</AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
