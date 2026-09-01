import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { privateMetadata } from "@/lib/seo";
import AuthShell, { type Highlight } from "@/components/auth/AuthShell";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export async function generateMetadata(
  props: PageProps<"/[locale]/forgot-password">,
): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "forgotPassword" });

  return privateMetadata({
    locale,
    path: "/forgot-password",
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

/* Keys only; the panel copy is translated alongside the rest of the screen. */
const HIGHLIGHT_KEYS = ["link", "nothing", "google"] as const;

export default async function ForgotPasswordPage() {
  const t = await getTranslations("forgotPassword");
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
      <ForgotPasswordForm />
    </AuthShell>
  );
}
