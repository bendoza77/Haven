import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import AuthShell, { type Highlight } from "@/components/auth/AuthShell";
import VerifyEmailClient from "./VerifyEmailClient";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("verifyEmail");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

const HIGHLIGHT_KEYS = ["once", "bag", "nothing"] as const;

export default async function VerifyEmailPage(
  props: PageProps<"/[locale]/verify-email/[token]">,
) {
  const { token } = await props.params;

  const t = await getTranslations("verifyEmail");
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
      <VerifyEmailClient token={token} />
    </AuthShell>
  );
}
