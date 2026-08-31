import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import UsersScreen from "@/components/console/UsersScreen";
import { consoles } from "@/lib/console";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("console");
  return { title: t("users.title"), description: t("meta.usersDescription") };
}

export default function AdminUsersPage() {
  return <UsersScreen config={consoles.admin} />;
}
