import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { privateMetadata } from "@/lib/seo";
import AuthShell, { type Highlight } from "@/components/auth/AuthShell";
import RegisterForm from "@/components/auth/RegisterForm";

export async function generateMetadata(props: PageProps<"/[locale]/register">): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "register" });

  return privateMetadata({
    locale,
    path: "/register",
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

/* Keys only; the panel copy is translated alongside the rest of the screen. */
const HIGHLIGHT_KEYS = ["firstLook", "wishlist", "returns"] as const;

export default async function RegisterPage() {
  const t = await getTranslations("register");
  const tShell = await getTranslations("authShell");

  const highlights: Highlight[] = HIGHLIGHT_KEYS.map((key) => ({
    title: t(`highlights.${key}Title`),
    description: t(`highlights.${key}Body`),
  }));

  return (
    <AuthShell
      eyebrow={tShell("eyebrow")}
      title={t("title")}
      description={t("description")}
      statement={t("statement")}
      highlights={highlights}
      footer={
        <>
          {t("footerPrompt")}{" "}
          <Link
            href="/login"
            className="font-medium text-ink underline underline-offset-4 transition-colors hover:text-ink-muted"
          >
            {t("footerLink")}
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
