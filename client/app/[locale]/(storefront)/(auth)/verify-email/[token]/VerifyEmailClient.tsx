"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { BadgeCheck, CircleAlert, LoaderCircle } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

/**
 * Spends the token from the welcome email.
 *
 * The link is followed by a mail client as often as by a person, so this runs
 * exactly once per mount — a second attempt would find the token already
 * spent and report a failure for something that in fact worked.
 */
export default function VerifyEmailClient({ token }: { token: string }) {
  const router = useRouter();
  const { adopt } = useAuth();
  const t = useTranslations("verifyEmail");
  const tAuth = useTranslations("auth");

  const [state, setState] = useState<"working" | "done" | "failed">("working");
  const [message, setMessage] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    api
      .verifyEmail(token)
      .then((response) => {
        /* The API signed them in as part of confirming, so this is the end of
           the sign-up journey: adopt the session and go to the profile. */
        adopt(response.data);
        setState("done");
        router.replace("/account");
      })
      .catch((error: unknown) => {
        setMessage(error instanceof Error ? error.message : t("linkUnusable"));
        setState("failed");
      });
  }, [token, adopt, router, t]);

  if (state === "working") {
    return (
      <p className="flex items-center gap-2.5 rounded-lg border border-line bg-surface px-4 py-5 text-sm text-ink-muted">
        <LoaderCircle className="size-4 animate-spin" strokeWidth={1.75} aria-hidden />
        {t("working")}
      </p>
    );
  }

  if (state === "failed") {
    return (
      <div className="rounded-lg border border-line bg-surface p-6">
        <span className="flex size-11 items-center justify-center rounded-full bg-canvas text-danger">
          <CircleAlert className="size-5" strokeWidth={1.75} aria-hidden />
        </span>
        <h2 className="mt-4 text-sm font-medium text-ink">{t("failedTitle")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">{message}</p>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">{t("failedNote")}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <ButtonLink href="/login">{tAuth("signIn")}</ButtonLink>
          <ButtonLink href="/register" variant="secondary">
            {tAuth("createAccount")}
          </ButtonLink>
        </div>
      </div>
    );
  }

  /* Confirmed. The redirect to the profile is already in flight — this is the
     half-second before it lands, not a screen to act on. */
  return (
    <div className="rounded-lg border border-line bg-surface p-6">
      <span className="flex size-11 items-center justify-center rounded-full bg-canvas text-success">
        <BadgeCheck className="size-5" strokeWidth={1.75} aria-hidden />
      </span>
      <h2 className="mt-4 text-sm font-medium text-ink">{t("confirmedTitle")}</h2>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">{t("confirmedBody")}</p>
      <p className="mt-6 text-xs text-ink-subtle">
        {t("notMoving")}{" "}
        <Link href="/account" className="underline underline-offset-4">
          {t("goToProfile")}
        </Link>
        .
      </p>
    </div>
  );
}
