"use client";

import { Link } from "@/i18n/navigation";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button, ButtonLink } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";

export default function AuthNav() {
  const t = useTranslations("auth");
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  if (loading) {
    return <span className="h-9 w-40 animate-pulse rounded-md bg-surface" />;
  }

  if (!user) {
    return (
      <>
        <ButtonLink href="/login" variant="secondary" size="sm">
          {t("signIn")}
        </ButtonLink>
        <ButtonLink href="/register" size="sm">
          {t("createAccount")}
        </ButtonLink>
      </>
    );
  }

  return (
    <>
      <Link
        href="/account"
        className="text-sm text-ink-muted transition-colors hover:text-ink"
      >
        {user.fullname}
      </Link>
      <Button
        variant="secondary"
        size="sm"
        onClick={async () => {
          await logout();
          router.push("/");
        }}
      >
        {t("signOut")}
      </Button>
    </>
  );
}
