"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useValidationMessage } from "@/components/auth/useValidationMessage";
import { LoaderCircle } from "lucide-react";
import AuthDivider from "@/components/auth/AuthDivider";
import { CheckboxField, PasswordField, TextField } from "@/components/auth/AuthField";
import GoogleButton from "@/components/auth/GoogleButton";
import TwoFactorForm from "@/components/auth/TwoFactorForm";
import { Button } from "@/components/ui/Button";
import { destinationAfterAuth } from "@/lib/redirect";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { validateCurrentPassword, validateEmail } from "@/lib/auth";

const validators = {
  email: validateEmail,
  password: validateCurrentPassword,
};

type FieldName = keyof typeof validators;

export default function LoginForm() {
  const t = useTranslations("authForm");
  const vm = useValidationMessage();
  const router = useRouter();

  const { login } = useAuth();
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  /* Holds the address when sign-in failed only because it is unconfirmed. */
  const [unconfirmed, setUnconfirmed] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const [pending, setPending] = useState(false);
  /* Set when the password was right but the account wants a code as well. The
     whole form is replaced by the code step while this holds an address. */
  const [awaitingCode, setAwaitingCode] = useState<string | null>(null);

  /** Judge a field once the user has left it, never while they are still typing. */
  const checkOnBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const name = event.target.name as FieldName;
    const message = validators[name](event.target.value);
    setErrors((current) =>
      current[name] === (message ?? undefined) ? current : { ...current, [name]: message ?? undefined },
    );
  };

  /** Typing clears the complaint immediately — no waiting for a second submit. */
  const clearOnInput = (event: React.FormEvent<HTMLInputElement>) => {
    const name = event.currentTarget.name as FieldName;
    setErrors((current) => (current[name] ? { ...current, [name]: undefined } : current));
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    const next: Partial<Record<FieldName, string>> = {};
    for (const name of Object.keys(validators) as FieldName[]) {
      const message = validators[name](String(data.get(name) ?? ""));
      if (message) next[name] = message;
    }

    const firstInvalid = (Object.keys(validators) as FieldName[]).find((name) => next[name]);
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
      const { twoFactorRequired } = await login(email, String(data.get("password")));

      if (twoFactorRequired) {
        setAwaitingCode(email);
        setPending(false);
        return;
      }

      router.push(destinationAfterAuth());
    } catch (error) {
      const message = error instanceof Error ? error.message : t("somethingWentWrong");
      setFormError(message);
      /* The one failure with a way out: the password was right, the address
         just is not confirmed. Offer the link rather than a dead end. */
      setUnconfirmed(message.toLowerCase().includes("confirm your email") ? email : null);
      setPending(false);
    }
  };

  if (awaitingCode) {
    return (
      <TwoFactorForm
        email={awaitingCode}
        onDone={() => router.push(destinationAfterAuth())}
        onBack={() => {
          setAwaitingCode(null);
          setFormError(null);
        }}
      />
    );
  }

  return (
    <>
      <GoogleButton label={t("continueWithGoogle")} />

      <AuthDivider>{t("orWithEmail")}</AuthDivider>

      <form onSubmit={onSubmit} noValidate className="space-y-5">
        {formError && (
          <div
            role="alert"
            className="rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger"
          >
            {formError}
            {unconfirmed && (
              <div className="mt-3">
                {resent ? (
                  <p className="text-ink-muted">
                    {t("resendLinkTo", { email: unconfirmed })}
                  </p>
                ) : (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={async () => {
                      try {
                        await api.resendVerification(unconfirmed);
                      } finally {
                        setResent(true);
                      }
                    }}
                  >
                    {t("sendLinkAgain")}
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        <TextField
          id="login-email"
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
          error={vm(errors.email)}
          onBlur={checkOnBlur}
          onInput={clearOnInput}
        />

        <PasswordField
          id="login-password"
          name="password"
          label={t("password")}
          placeholder="••••••••"
          autoComplete="current-password"
          enterKeyHint="go"
          error={vm(errors.password)}
          onBlur={checkOnBlur}
          onInput={clearOnInput}
          action={
            <Link
              href="/forgot-password"
              className="text-xs text-ink-muted underline underline-offset-4 transition-colors hover:text-ink"
            >
              {t("forgotPassword")}
            </Link>
          }
        />

        <CheckboxField id="login-remember" name="remember" defaultChecked>
          {t("keepSignedIn")}
        </CheckboxField>

        <Button type="submit" size="lg" fullWidth disabled={pending}>
          {pending && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
          {pending ? t("signingIn") : t("signIn")}
        </Button>
      </form>
    </>
  );
}
