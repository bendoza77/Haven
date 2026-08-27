"use client";

import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import ConsoleLogin from "@/components/console/ConsoleLogin";
import { useConsoleAuth } from "@/context/ConsoleAuthContext";
import type { ConsoleConfig } from "@/lib/console";

/**
 * Decides who gets to see a console at all.
 *
 * Entry needs two things, not one: a correct password AND the role this
 * console belongs to. An administrator opens the admin console, a moderator
 * opens the moderator console, and everybody else — customers included — gets
 * a form or an explanation instead. The two consoles draw different controls
 * because they answer to different roles, so letting one role wander into the
 * other's screens would show somebody affordances their session cannot use.
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

  /* ConsoleLogin tells the three refusals apart: nobody signed in, a customer,
     or staff standing in front of the other console's door. */
  if (!staff || staff.role !== config.role) {
    return <ConsoleLogin config={config} />;
  }

  return <>{children}</>;
}
