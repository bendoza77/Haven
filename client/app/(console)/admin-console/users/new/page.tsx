import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import ConsoleHeader from "@/components/console/ConsoleHeader";
import UserForm from "@/components/console/UserForm";
import { consoles } from "@/lib/console";

const config = consoles.admin;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("console");
  return { title: t("users.newTitle"), description: t("meta.newUserDescription") };
}

export default async function AdminNewUserPage() {
  const t = await getTranslations("console");

  return (
    <div className="space-y-8">
      <ConsoleHeader
        breadcrumb={[
          { label: t("breadcrumb.console"), href: config.base },
          { label: t("breadcrumb.users"), href: `${config.base}/users` },
          { label: t("breadcrumb.new") },
        ]}
        title={t("users.newTitle")}
        description={t("users.newDescription")}
      />

      <UserForm config={config} submitLabel={t("actions.createAccount")} />
    </div>
  );
}
