import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import ConsoleGuard from "@/components/console/ConsoleGuard";
import ConsoleShell from "@/components/console/ConsoleShell";
import { consoles } from "@/lib/console";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("console");

  return {
    title: {
      default: t("adminConsole"),
      template: t("meta.adminTemplate"),
    },
    description: t("adminBlurb"),
  };
}

export default function AdminConsoleLayout({ children }: LayoutProps<"/[locale]/admin-console">) {
  return (
    <ConsoleGuard config={consoles.admin}>
      <ConsoleShell config={consoles.admin}>{children}</ConsoleShell>
    </ConsoleGuard>
  );
}
