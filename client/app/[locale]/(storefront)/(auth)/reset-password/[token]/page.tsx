import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { privateMetadata } from "@/lib/seo";
import AuthShell, { type Highlight } from "@/components/auth/AuthShell";
import ResetPasswordForm from "./ResetPasswordForm";

export async function generateMetadata(
  props: PageProps<"/[locale]/reset-password/[token]">,
): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "resetPassword" });

  /* The canonical deliberately drops the token: it is single-use and personal,
     and an address that names it is not one anybody else should ever hold. */
  return privateMetadata({
    locale,
    path: "/reset-password",
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

const HIGHLIGHT_KEYS = ["link", "signedIn", "old"] as const;

export default async function ResetPasswordPage(
  props: PageProps<"/[locale]/reset-password/[token]">,
) {
  const { token } = await props.params;

  const t = await getTranslations("resetPassword");
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
      <ResetPasswordForm token={token} />
    </AuthShell>
  );
}
