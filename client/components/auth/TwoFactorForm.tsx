"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, LoaderCircle, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

const LENGTH = 6;

/**
 * The second step of a two-step sign-in.
 *
 * Six separate boxes rather than one field: it makes the length of the code
 * obvious, and it is what every authenticator flow has trained people to
 * expect. Paste is handled explicitly, because a code arriving by email is
 * almost always pasted rather than typed.
 */
export default function TwoFactorForm({
  email,
  onDone,
  onBack,
}: {
  email: string;
  onDone: () => void;
  onBack: () => void;
}) {
  const t = useTranslations("authForm");
  const { verifyTwoFactor } = useAuth();

  const [digits, setDigits] = useState<string[]>(Array(LENGTH).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [resent, setResent] = useState(false);

  const boxes = useRef<(HTMLInputElement | null)[]>([]);

  const code = digits.join("");

  const focusBox = (index: number) => boxes.current[index]?.focus();

  const submit = async (value: string) => {
    if (pending) return;

    setError(null);
    setPending(true);

    try {
      await verifyTwoFactor(email, value);
      onDone();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : t("codeDidNotWork"));
      setDigits(Array(LENGTH).fill(""));
      focusBox(0);
      setPending(false);
    }
  };

  const write = (index: number, raw: string) => {
    const cleaned = raw.replace(/\D/g, "");
    if (!cleaned) return;

    setDigits((current) => {
      const next = [...current];

      /* One character advances; a pasted run fills forward from here. */
      for (let offset = 0; offset < cleaned.length && index + offset < LENGTH; offset += 1) {
        next[index + offset] = cleaned[offset];
      }

      const filled = Math.min(index + cleaned.length, LENGTH - 1);
      window.requestAnimationFrame(() => focusBox(filled));

      const complete = next.join("");
      if (complete.length === LENGTH && !complete.includes("")) {
        window.requestAnimationFrame(() => void submit(complete));
      }

      return next;
    });
  };

  const onKeyDown = (index: number) => (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace") {
      event.preventDefault();

      setDigits((current) => {
        const next = [...current];

        /* Clear this box, or step back into the previous one if already empty
           — the behaviour a reader expects from a run of boxes. */
        if (next[index]) {
          next[index] = "";
        } else if (index > 0) {
          next[index - 1] = "";
          window.requestAnimationFrame(() => focusBox(index - 1));
        }

        return next;
      });
    }

    if (event.key === "ArrowLeft" && index > 0) focusBox(index - 1);
    if (event.key === "ArrowRight" && index < LENGTH - 1) focusBox(index + 1);
  };

  return (
    <div>
      <div className="mb-6 flex items-start gap-3 rounded-lg border border-line bg-surface px-4 py-4">
        <MailCheck className="mt-0.5 size-5 shrink-0 text-ink" strokeWidth={1.75} aria-hidden />
        <p className="text-sm leading-relaxed text-ink-muted">
          {t("codeSentBefore")} <span className="font-medium text-ink">{email}</span>
          {t("codeSentAfter")}
        </p>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (code.length === LENGTH) void submit(code);
        }}
        noValidate
      >
        <fieldset disabled={pending}>
          <legend className="mb-3 block text-sm font-medium text-ink">{t("signInCode")}</legend>

          <div className="flex items-center justify-between gap-2">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(element) => {
                  boxes.current[index] = element;
                }}
                value={digit}
                onChange={(event) => write(index, event.target.value)}
                onKeyDown={onKeyDown(index)}
                onFocus={(event) => event.target.select()}
                type="text"
                inputMode="numeric"
                autoComplete={index === 0 ? "one-time-code" : "off"}
                aria-label={t("digitOf", { index: index + 1, total: LENGTH })}
                autoFocus={index === 0}
                className="h-14 w-full min-w-0 rounded-md border border-line-strong bg-canvas text-center font-mono text-xl text-ink transition-colors hover:border-ink-subtle focus:border-ink focus:outline-none disabled:opacity-60"
              />
            ))}
          </div>
        </fieldset>

        <p role="alert" aria-live="polite" className="sr-only">
          {error ?? ""}
        </p>

        {error && (
          <div className="mt-4 rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        <Button type="submit" size="lg" fullWidth disabled={pending || code.length < LENGTH} className="mt-6">
          {pending && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
          {pending ? t("checking") : t("verifyAndSignIn")}
        </Button>
      </form>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-ink-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-4" strokeWidth={1.75} aria-hidden />
          {t("useDifferentAccount")}
        </button>

        {resent ? (
          <span className="text-ink-subtle">{t("newCodeSent")}</span>
        ) : (
          <button
            type="button"
            onClick={async () => {
              try {
                await api.resendTwoFactor(email);
              } finally {
                setResent(true);
              }
            }}
            className="text-ink underline underline-offset-4 transition-colors hover:text-accent"
          >
            {t("sendNewCode")}
          </button>
        )}
      </div>
    </div>
  );
}
