"use client";

import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import ConsoleLogin from "@/components/console/ConsoleLogin";
import { useConsoleAuth } from "@/context/ConsoleAuthContext";
import type { ConsoleConfig } from "@/lib/console";

/**
 * Decides who gets to see a console at all.
 *
 * Entry needs two things, not one: a correct password AND a role that may open
 * a console. A signed-in customer has the first and not the second, so `staff`
 * is null for them and ConsoleLogin explains why rather than pretending the
 * password was wrong.
 *
 * This is not the security boundary. The Express API checks the same role on
 * every request, which is what actually protects the data; this is what stops
 * the screens from being browsed, and it shows a sign-in form rather than
 * bouncing people elsewhere, so somebody who lands here deep-linked stays
 * where they meant to be.
 */
export default function ConsoleGuard({
  config,
  children,
}: {
  config: ConsoleConfig;
  children: React.ReactNode;
}) {
  const t = useTranslations("console");
  const { staff, loading } = useConsoleAuth();

  /* The session is restored asynchronously. Rendering the form during that
     window would flash sign-in at somebody already signed in. */
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 py-24">
        <p className="flex items-center gap-2.5 text-sm text-ink-muted">
          <Loader2 className="size-4 animate-spin" strokeWidth={1.75} aria-hidden />
          {t("shell.checkingAccess")}
        </p>
      </div>
    );
  }

  if (!staff) {
    return <ConsoleLogin config={config} />;
  }

  return <>{children}</>;
}
