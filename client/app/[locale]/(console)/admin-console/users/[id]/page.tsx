import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import UserEditor from "@/components/console/UserEditor";
import { consoles } from "@/lib/console";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("console");
  return { title: t("meta.editUser") };
}

/* The account itself is read in the browser — see UserEditor for why — so the
   title here is the generic one rather than the person's name. */
export default async function AdminEditUserPage(props: PageProps<"/[locale]/admin-console/users/[id]">) {
  const { id } = await props.params;

  return <UserEditor config={consoles.admin} id={id} />;
}
