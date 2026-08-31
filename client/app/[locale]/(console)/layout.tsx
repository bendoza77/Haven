import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { ConsoleAuthProvider } from "@/context/ConsoleAuthContext";
import { ReviewProvider } from "@/context/ReviewContext";
import { UserProvider } from "@/context/UserContext";
import { CONSOLE_CLIENT, clientMessages } from "@/i18n/messages";

/**
 * Everything staff-facing sits under one session.
 *
 * The providers live here rather than in each console's own layout so that
 * moving between /admin-console and /moderator-console does not tear down and
 * re-establish the session — Next keeps this layout mounted across both.
 *
 * Neither data provider fetches anything on mount, so a console carrying one
 * it does not use costs nothing.
 *
 * The console's dictionary is declared here and nowhere else. It is the
 * largest namespace in the file — 13 kB of English, 27 kB of Georgian — and
 * used to be sent to every shopper on every page. Behind this layout it is
 * paid for only by the people who open a console.
 */
export default async function ConsoleGroupLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const messages = await clientMessages(CONSOLE_CLIENT);

  return (
    <NextIntlClientProvider messages={messages}>
      <ConsoleAuthProvider>
        <UserProvider>
          <ReviewProvider>{children}</ReviewProvider>
        </UserProvider>
      </ConsoleAuthProvider>
    </NextIntlClientProvider>
  );
}
