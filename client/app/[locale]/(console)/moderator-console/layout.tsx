import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import ConsoleGuard from "@/components/console/ConsoleGuard";
import ConsoleShell from "@/components/console/ConsoleShell";
import { consoles } from "@/lib/console";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("console");

  return {
    title: {
      default: t("moderatorConsole"),
      template: t("meta.moderatorTemplate"),
    },
    description: t("moderatorBlurb"),
  };
}

export default function ModeratorConsoleLayout({ children }: LayoutProps<"/[locale]/moderator-console">) {
  return (
    <ConsoleGuard config={consoles.moderator}>
      <ConsoleShell config={consoles.moderator}>{children}</ConsoleShell>
    </ConsoleGuard>
  );
}
