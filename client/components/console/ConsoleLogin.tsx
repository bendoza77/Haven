"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { AlertCircle, ArrowLeft, Loader2, Lock, ShieldX } from "lucide-react";
import TwoFactorForm from "@/components/auth/TwoFactorForm";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { useAuth } from "@/context/AuthContext";
import { useConsoleAuth } from "@/context/ConsoleAuthContext";
import type { ConsoleConfig } from "@/lib/console";
import { site } from "@/lib/site";

/**
 * The gate on both consoles.
 *
 * The password is checked by the API, and the role decides the rest: a correct
 * email and password belonging to a customer signs that customer in and still
 * does not open a console. That refusal is drawn below rather than hidden as a
 * failed login, because the credentials were not the problem and saying so
 * saves somebody retyping a password that was right.
 *
 * Two-step accounts pass through the same code step as the storefront.
 */
export default function ConsoleLogin({ config }: { config: ConsoleConfig }) {
  const t = useTranslations("console");
  const { login, logout } = useAuth();
  const { account } = useConsoleAuth();

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [awaitingCode, setAwaitingCode] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (busy) return;

    /* Read off the form rather than from state: a saved staff password filled
       by the browser does not always notify React. */
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    if (!email || !password) {
      setError(t("login.enterCredentials"));
      return;
    }

    setError(null);
    setBusy(true);

    try {
      const { twoFactorRequired } = await login(email, password);

      if (twoFactorRequired) {
        setAwaitingCode(email);
        setBusy(false);
        return;
      }

      /* Nothing to navigate to — the guard watches the same session and swaps
         this form for the console the moment a staff account appears. */
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : t("login.couldNotSignIn"));
      setBusy(false);
    }
  };

  const shell = (children: React.ReactNode) => (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="font-display text-3xl leading-none tracking-tight text-ink">
            {site.name}
          </Link>
          <p className="mt-3 text-[0.625rem] font-medium uppercase tracking-[0.18em] text-ink-subtle">
            {t(config.labelKey)}
          </p>
        </div>

        <div className="rounded-lg border border-line bg-surface p-6 shadow-card sm:p-7">
          {children}
        </div>

        <Link
          href="/"
          className="mt-6 flex items-center justify-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-4" strokeWidth={1.75} aria-hidden />
          {t("login.backToShop")}
        </Link>
      </div>
    </div>
  );

  /* Signed in, credentials fine, role wrong. The one case where saying exactly
     what happened is safe: they already proved the account is theirs. */
  if (account) {
    return shell(
      <>
        <div className="mb-5 flex items-start gap-3">
          <span
            aria-hidden
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-danger/10 text-danger"
          >
            <ShieldX className="size-4" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <h1 className="font-display text-xl leading-tight tracking-tight text-ink">
              {t("login.noAccessTitle")}
            </h1>
            <p className="mt-1 text-xs leading-relaxed text-ink-muted">
              {t("login.noAccessBodyBefore")}{" "}
              <span className="font-medium text-ink">{account.email}</span>
              {t("login.noAccessBodyAfter")}
            </p>
          </div>
        </div>

        <p className="mb-5 rounded-md bg-canvas px-3.5 py-3 text-xs leading-relaxed text-ink-muted">
          {t("login.noAccessNote")}
        </p>

        <Button
          type="button"
          fullWidth
          variant="secondary"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await logout();
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? t("login.signingOut") : t("login.signInAsSomebodyElse")}
        </Button>
      </>,
    );
  }

  if (awaitingCode) {
    return shell(
      <TwoFactorForm
        email={awaitingCode}
        onDone={() => {
          /* The guard re-reads the session and decides; if the role is wrong
             the branch above takes over from here. */
        }}
        onBack={() => {
          setAwaitingCode(null);
          setError(null);
        }}
      />,
    );
  }

  return shell(
    <>
      <div className="mb-6 flex items-start gap-3">
        <span
          aria-hidden
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ink text-canvas"
        >
          <Lock className="size-4" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <h1 className="font-display text-xl leading-tight tracking-tight text-ink">
            {t("login.staffSignIn")}
          </h1>
          <p className="mt-1 text-xs leading-relaxed text-ink-muted">
            {/* The role is interpolated whole rather than lower-cased and
                pluralised in code: Georgian does neither the way English does. */}
            {t("login.staffSignInBody", { role: t(config.roleLabelKey) })}
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Input
          id="console-email"
          name="email"
          label={t("login.email")}
          type="email"
          autoComplete="username"
          placeholder={t("login.emailPlaceholder")}
          defaultValue=""
          disabled={busy}
          required
        />

        <Input
          id="console-password"
          name="password"
          label={t("login.password")}
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          defaultValue=""
          disabled={busy}
          required
        />

        <p role="alert" aria-live="polite" className="sr-only">
          {error ?? ""}
        </p>

        {error && (
          <p className="flex items-start gap-2.5 rounded-md border border-danger/30 bg-danger/10 px-3.5 py-3 text-xs leading-relaxed text-ink">
            <AlertCircle className="mt-px size-4 shrink-0 text-danger" strokeWidth={1.75} aria-hidden />
            {error}
          </p>
        )}

        <Button type="submit" fullWidth disabled={busy}>
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" strokeWidth={1.75} aria-hidden />
              {t("login.signingIn")}
            </>
          ) : (
            t("login.signIn")
          )}
        </Button>
      </form>
    </>,
  );
}
