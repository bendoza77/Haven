"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, Check, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

/**
 * The two-step sign-in switch.
 *
 * Turning it on is one click; turning it off asks for the password, because
 * somebody who has walked up to an unlocked laptop should only be able to make
 * the account harder to reach, never easier. The server enforces that — this
 * only collects what it asks for.
 */
export default function TwoFactorSetting() {
  const t = useTranslations("twoFactor");
  const tCommon = useTranslations("common");
  const { user, adopt } = useAuth();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  /* Set while the password is being collected to turn the setting off. */
  const [confirming, setConfirming] = useState(false);

  const enabled = Boolean(user?.twoFactorEnabled);
  const google = user?.provider === "google";

  const apply = async (next: boolean, password?: string) => {
    setBusy(true);
    setError(null);
    setNote(null);

    try {
      const response = await api.account.setTwoFactor(next, password);
      adopt(response.data);
      setConfirming(false);
      setNote(response.message ?? null);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : t("couldNotChange"));
    } finally {
      setBusy(false);
    }
  };

  if (google) {
    return (
      <div className="rounded-lg border border-line p-6">
        <h3 className="text-sm font-medium text-ink">{t("heading")}</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">{t("googleBody")}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-line p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-ink">{t("heading")}</h3>
            {enabled && (
              <span className="inline-flex items-center gap-1 rounded-sm bg-success/10 px-1.5 py-0.5 text-[0.625rem] font-medium uppercase tracking-[0.08em] text-success">
                <Check className="size-3" strokeWidth={2.5} aria-hidden />
                {t("on")}
              </span>
            )}
          </div>

          <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-muted">
            {enabled ? t("enabledBody") : t("disabledBody")}
          </p>
        </div>

        <span
          aria-hidden
          className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
            enabled ? "bg-success/10 text-success" : "bg-surface text-ink-subtle"
          }`}
        >
          <ShieldCheck className="size-5" strokeWidth={1.75} />
        </span>
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {note ?? error ?? ""}
      </p>

      {error && (
        <p className="mt-4 flex items-start gap-2.5 rounded-md border border-danger/30 bg-danger/10 px-3.5 py-3 text-xs leading-relaxed text-ink">
          <AlertCircle className="mt-px size-4 shrink-0 text-danger" strokeWidth={1.75} aria-hidden />
          {error}
        </p>
      )}

      {note && !error && (
        <p className="mt-4 rounded-md bg-surface px-3.5 py-3 text-xs leading-relaxed text-ink-muted">
          {note}
        </p>
      )}

      {confirming ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const password = String(new FormData(event.currentTarget).get("password") ?? "");

            if (!password) {
              setError(t("enterPassword"));
              return;
            }

            void apply(false, password);
          }}
          noValidate
          className="mt-5 border-t border-line pt-5"
        >
          <Input
            id="twofactor-password"
            name="password"
            label={t("confirmPassword")}
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            hint={t("confirmHint")}
            disabled={busy}
          />

          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="submit" size="sm" disabled={busy}>
              {busy ? (
                <>
                  <Loader2 className="size-4 animate-spin" strokeWidth={1.75} aria-hidden />
                  {t("turningOff")}
                </>
              ) : (
                t("turnOff")
              )}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={busy}
              onClick={() => {
                setConfirming(false);
                setError(null);
              }}
            >
              {tCommon("cancel")}
            </Button>
          </div>
        </form>
      ) : (
        <Button
          type="button"
          variant={enabled ? "secondary" : "primary"}
          size="sm"
          disabled={busy}
          className="mt-5"
          onClick={() => {
            setError(null);
            setNote(null);

            if (enabled) {
              setConfirming(true);
            } else {
              void apply(true);
            }
          }}
        >
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" strokeWidth={1.75} aria-hidden />
              {tCommon("saving")}
            </>
          ) : enabled ? (
            t("turnOffLong")
          ) : (
            t("turnOnLong")
          )}
        </Button>
      )}
    </div>
  );
}
