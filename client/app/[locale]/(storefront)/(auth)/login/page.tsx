import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { privateMetadata } from "@/lib/seo";
import AuthShell, { type Highlight } from "@/components/auth/AuthShell";
import LoginForm from "@/components/auth/LoginForm";

export async function generateMetadata(props: PageProps<"/[locale]/login">): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "login" });

  return privateMetadata({
    locale,
    path: "/login",
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

/* Keys only; the panel copy is translated alongside the rest of the screen. */
const HIGHLIGHT_KEYS = ["orders", "saved", "checkout"] as const;

export default async function LoginPage() {
  const t = await getTranslations("login");
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
            href="/register"
            className="font-medium text-ink underline underline-offset-4 transition-colors hover:text-ink-muted"
          >
            {t("footerLink")}
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
