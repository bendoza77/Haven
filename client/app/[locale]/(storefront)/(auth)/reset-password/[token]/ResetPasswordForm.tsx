"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useValidationMessage } from "@/components/auth/useValidationMessage";
import { CircleAlert, LoaderCircle } from "lucide-react";
import { PasswordField } from "@/components/auth/AuthField";
import { Button, ButtonLink } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { validateNewPassword } from "@/lib/auth";

/**
 * Spends the token from the reset email and sets the new password.
 *
 * The API signs the shopper in as part of the reset, so there is no second
 * trip through the sign-in form afterwards.
 */
export default function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const { adopt } = useAuth();

  const t = useTranslations("resetPassword");
  const vm = useValidationMessage();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const problem = validateNewPassword(password);
    if (problem) {
      setError(vm(problem));
      return;
    }

    if (password !== confirm) {
      setConfirmError(t("passwordsMustMatch"));
      return;
    }

    setError(null);
    setConfirmError(null);
    setFailure(null);
    setPending(true);

    try {
      const response = await api.resetPassword(token, password);
      adopt(response.data);
      router.push("/account");
    } catch (resetError) {
      setFailure(
        resetError instanceof Error ? resetError.message : t("linkUnusable"),
      );
      setPending(false);
    }
  };

  if (failure) {
    return (
      <div className="rounded-lg border border-line bg-surface p-6">
        <span className="flex size-11 items-center justify-center rounded-full bg-canvas text-danger">
          <CircleAlert className="size-5" strokeWidth={1.75} aria-hidden />
        </span>
        <h2 className="mt-4 text-sm font-medium text-ink">{t("linkFailedTitle")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">{failure}</p>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">{t("linkFailedNote")}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <ButtonLink href="/forgot-password">{t("sendNewLink")}</ButtonLink>
          <ButtonLink href="/login" variant="secondary">
            {t("backToSignIn")}
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <PasswordField
        id="new-password"
        name="password"
        label={t("newPassword")}
        placeholder={t("newPasswordPlaceholder")}
        autoComplete="new-password"
        value={password}
        onChange={(event) => {
          setPassword(event.target.value);
          setError(null);
        }}
        error={error}
        strength
      />

      <PasswordField
        id="confirm-password"
        name="confirm"
        label={t("confirmPassword")}
        placeholder={t("confirmPasswordPlaceholder")}
        autoComplete="new-password"
        value={confirm}
        onChange={(event) => {
          setConfirm(event.target.value);
          setConfirmError(null);
        }}
        error={confirmError}
      />

      <Button type="submit" size="lg" fullWidth disabled={pending}>
        {pending && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
        {pending ? t("setting") : t("setPassword")}
      </Button>
    </form>
  );
}
