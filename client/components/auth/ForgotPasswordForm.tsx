"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useValidationMessage } from "@/components/auth/useValidationMessage";
import { LoaderCircle, MailCheck } from "lucide-react";
import { TextField } from "@/components/auth/AuthField";
import { Button } from "@/components/ui/Button";
import { validateEmail } from "@/lib/auth";
import { api } from "@/lib/api";

export default function ForgotPasswordForm() {
  const t = useTranslations("authForm");
  const vm = useValidationMessage();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const email = String(new FormData(form).get("email") ?? "").trim();

    const message = validateEmail(email);
    if (message) {
      setError(vm(message));
      (form.elements.namedItem("email") as HTMLInputElement | null)?.focus();
      return;
    }

    setError(null);
    setPending(true);

    try {
      /* The API answers the same way whether or not the address has an
         account, so this screen can too — and does not become a way to find
         out which emails are registered. */
      await api.forgotPassword(email);
      setSentTo(email);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t("couldNotSendEmail"));
    } finally {
      setPending(false);
    }
  };

  if (sentTo) {
    return (
      <div className="rounded-lg border border-line bg-surface p-6">
        <span className="flex size-11 items-center justify-center rounded-full bg-canvas text-success">
          <MailCheck className="size-5" strokeWidth={1.75} aria-hidden />
        </span>
        <h2 className="mt-4 text-sm font-medium text-ink">{t("checkInbox")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          {t("resetSentBefore")} <span className="text-ink">{sentTo}</span>
          {t("resetSentAfter")}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Link
            href="/login"
            className="text-sm text-ink underline underline-offset-4 transition-colors hover:text-ink-muted"
          >
            {t("backToSignIn")}
          </Link>
          <Button type="button" variant="ghost" size="sm" className="px-0" onClick={() => setSentTo(null)}>
            {t("useDifferentEmail")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <TextField
        id="reset-email"
        name="email"
        label={t("emailAddress")}
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        inputMode="email"
        enterKeyHint="send"
        error={error}
        onInput={() => setError(null)}
      />

      <Button type="submit" size="lg" fullWidth disabled={pending}>
        {pending && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
        {t("sendResetLink")}
      </Button>
    </form>
  );
}
