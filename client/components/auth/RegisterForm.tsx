"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useValidationMessage } from "@/components/auth/useValidationMessage";
import { LoaderCircle, MailCheck } from "lucide-react";
import AuthDivider from "@/components/auth/AuthDivider";
import { CheckboxField, PasswordField, TextField } from "@/components/auth/AuthField";
import GoogleButton from "@/components/auth/GoogleButton";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { validateEmail, validateName, validateNewPassword } from "@/lib/auth";

const validators = {
  fullname: validateName,
  email: validateEmail,
  password: validateNewPassword,
};

type FieldName = keyof typeof validators;

export default function RegisterForm() {
  const t = useTranslations("authForm");
  const vm = useValidationMessage();
  const { signup } = useAuth();
  /* Set once the account exists — the form is replaced by the inbox notice. */
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<FieldName | "terms", string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const checkOnBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const name = event.target.name as FieldName;
    const message = validators[name](event.target.value);
    setErrors((current) =>
      current[name] === (message ?? undefined) ? current : { ...current, [name]: message ?? undefined },
    );
  };

  const clearOnInput = (event: React.FormEvent<HTMLInputElement>) => {
    const name = event.currentTarget.name as FieldName;
    setErrors((current) => (current[name] ? { ...current, [name]: undefined } : current));
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    const next: Partial<Record<FieldName | "terms", string>> = {};
    for (const name of Object.keys(validators) as FieldName[]) {
      const message = validators[name](String(data.get(name) ?? ""));
      if (message) next[name] = message;
    }
    if (!data.get("terms")) next.terms = "acceptTerms";

    const order = [...(Object.keys(validators) as FieldName[]), "terms" as const];
    const firstInvalid = order.find((name) => next[name]);
    if (firstInvalid) {
      setErrors(next);
      (form.elements.namedItem(firstInvalid) as HTMLInputElement | null)?.focus();
      return;
    }

    setErrors({});
    setFormError(null);
    setPending(true);

    const email = String(data.get("email")).trim();

    try {
      await signup(String(data.get("fullname")), email, String(data.get("password")));
      /* No redirect: there is no session yet. The link in the email confirms
         the address and signs them in, landing them on their profile. */
      setSentTo(email);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : t("somethingWentWrong"));
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
        <h2 className="mt-4 text-sm font-medium text-ink">{t("confirmEmailTitle")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          {t("confirmEmailBody")} <span className="text-ink">{sentTo}</span>{" "}
          {t("confirmEmailBodyEnd")}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">{t("confirmEmailNote")}</p>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          {resent ? (
            <p className="text-sm text-success">{t("newLinkSent")}</p>
          ) : (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={async () => {
                try {
                  await api.resendVerification(sentTo);
                } finally {
                  setResent(true);
                }
              }}
            >
              {t("resendTheLink")}
            </Button>
          )}
          <Link
            href="/login"
            className="text-sm text-ink underline underline-offset-4 transition-colors hover:text-ink-muted"
          >
            {t("goToSignIn")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <GoogleButton label={t("signUpWithGoogle")} />

      <AuthDivider>or with email</AuthDivider>

      <form onSubmit={onSubmit} noValidate className="space-y-5">
        {formError && (
          <p role="alert" className="rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
            {formError}
          </p>
        )}

        <TextField
          id="register-name"
          name="fullname"
          label={t("fullName")}
          placeholder={t("fullNamePlaceholder")}
          autoComplete="name"
          enterKeyHint="next"
          maxLength={50}
          error={vm(errors.fullname)}
          onBlur={checkOnBlur}
          onInput={clearOnInput}
        />

        <TextField
          id="register-email"
          name="email"
          label={t("emailAddress")}
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          inputMode="email"
          enterKeyHint="next"
          hint={t("emailHint")}
          error={vm(errors.email)}
          onBlur={checkOnBlur}
          onInput={clearOnInput}
        />

        {/* No confirm field: the reveal toggle solves the same problem and
            removes a step people routinely paste their way through. */}
        <PasswordField
          id="register-password"
          name="password"
          label={t("password")}
          placeholder={t("passwordPlaceholder")}
          autoComplete="new-password"
          enterKeyHint="go"
          maxLength={50}
          strength
          hint={t("passwordHint")}
          error={vm(errors.password)}
          onBlur={checkOnBlur}
          onInput={clearOnInput}
        />

        <CheckboxField id="register-terms" name="terms" error={vm(errors.terms)}>
          I agree to the{" "}
          <Link
            href="/terms"
            target="_blank"
            className="text-ink underline underline-offset-4 hover:text-accent"
          >
            terms of sale
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            target="_blank"
            className="text-ink underline underline-offset-4 hover:text-accent"
          >
            privacy policy
          </Link>
          .
        </CheckboxField>

        <CheckboxField id="register-updates" name="updates" defaultChecked>
          {t("newsletterOptIn")}
        </CheckboxField>

        <Button type="submit" size="lg" fullWidth disabled={pending}>
          {pending && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
          {pending ? t("creatingAccount") : t("createAccount")}
        </Button>
      </form>
    </>
  );
}
