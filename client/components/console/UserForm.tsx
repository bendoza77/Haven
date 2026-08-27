"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AlertCircle, Loader2, ShieldAlert } from "lucide-react";
import Panel from "@/components/console/Panel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { useUser, type UserInput } from "@/context/UserContext";
import type { User } from "@/lib/api";
import { useDates } from "@/lib/format";
import { initialsOf, ROLES, type ConsoleConfig } from "@/lib/console";

/**
 * The account editor, for creating and for editing.
 *
 * Role is the consequential field on this screen, so it is a set of explained
 * choices rather than a dropdown that hides what each one grants. The server
 * refuses to demote or delete the last admin, so the one way to lock everybody
 * out of the console is closed there rather than hidden here.
 */
export default function UserForm({
  config,
  user,
  submitLabel,
}: {
  config: ConsoleConfig;
  user?: User;
  submitLabel: string;
}) {
  const t = useTranslations("console");
  const tCommon = useTranslations("common");
  const dates = useDates();

  const router = useRouter();
  const { createUser, updateUserById } = useUser();

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const editing = Boolean(user);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (busy) return;

    const form = new FormData(event.currentTarget);
    const fullname = String(form.get("fullname") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const role = String(form.get("role") ?? "user") as User["role"];
    const isVerifed = form.get("verified") === "on";

    if (!fullname || !email) {
      setError(t("form.nameAndEmailRequired"));
      return;
    }

    if (!editing && !password) {
      setError(t("form.choosePassword"));
      return;
    }

    setError(null);
    setBusy(true);

    try {
      if (user) {
        const payload: UserInput = { fullname, email, role, isVerifed };

        /* An empty password box means "leave it alone", not "blank it". */
        if (password) payload.password = password;

        await updateUserById(user._id, payload);
      } else {
        await createUser({ fullname, email, password, role });
      }

      router.push(`${config.base}/users`);
      router.refresh();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : t("form.couldNotSaveAccount"));
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start"
    >
      <div className="space-y-6">
        {error && (
          <p className="flex items-start gap-2.5 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
            <AlertCircle className="mt-px size-4 shrink-0" strokeWidth={1.75} aria-hidden />
            {error}
          </p>
        )}

        <Panel title={t("form.account")} description={t("form.accountHint")}>
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              id="user-name"
              name="fullname"
              label={t("form.fullName")}
              placeholder={t("form.fullNamePlaceholder")}
              defaultValue={user?.fullname ?? ""}
              disabled={busy}
              className="sm:col-span-2"
              required
            />
            <Input
              id="user-email"
              name="email"
              label={t("form.email")}
              type="email"
              placeholder={t("form.emailPlaceholder")}
              defaultValue={user?.email ?? ""}
              disabled={busy}
              className="sm:col-span-2"
              required
            />
            <Input
              id="user-password"
              name="password"
              label={editing ? t("form.newPassword") : t("form.password")}
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              hint={
                user && user.provider !== "local"
                  ? t("form.googleNoPassword")
                  : editing
                    ? t("form.leaveEmpty")
                    : t("form.passwordRules")
              }
              disabled={busy || (user ? user.provider !== "local" : false)}
              className="sm:col-span-2"
            />
          </div>
        </Panel>

        <Panel title={t("form.role")} description={t("form.roleHint")}>
          <fieldset className="space-y-2" disabled={busy}>
            <legend className="sr-only">{t("form.role")}</legend>

            {ROLES.map((role) => (
              <label
                key={role.value}
                className="flex cursor-pointer items-start gap-3 rounded-md border border-line px-3.5 py-3 transition-colors hover:border-line-strong has-[:checked]:border-ink has-[:checked]:bg-surface"
              >
                <input
                  type="radio"
                  name="role"
                  value={role.value}
                  defaultChecked={user ? user.role === role.value : role.value === "user"}
                  className="mt-0.5 size-4 accent-ink"
                />
                <span className="min-w-0">
                  <span className="block text-sm text-ink">{t(`roles.${role.key}`)}</span>
                  <span className="block text-xs text-ink-subtle">
                    {t(`roles.${role.key}Hint`)}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>

          <p className="mt-4 flex items-start gap-2.5 rounded-md bg-surface px-3.5 py-3 text-xs leading-relaxed text-ink-muted">
            <ShieldAlert className="mt-px size-4 shrink-0 text-warning" strokeWidth={1.75} aria-hidden />
            {t("form.adminWarning")}
          </p>
        </Panel>
      </div>

      {/* Not sticky, for the same reason as the product editor: the column
          outgrows a laptop viewport and would strand its own save button. */}
      <div className="space-y-6">
        {user && (
          <Panel title={t("form.summary")}>
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="flex size-11 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-medium text-canvas"
              >
                {initialsOf(user.fullname)}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-ink">{user.fullname}</span>
                <span className="block truncate text-xs text-ink-subtle">{user.email}</span>
              </span>
            </div>

            <dl className="mt-5 space-y-3 border-t border-line pt-4 text-sm">
              {[
                { key: "joined", label: t("table.joined"), value: dates.short(user.createdAt) },
                {
                  key: "signIn",
                  label: t("users.signIn"),
                  value: user.provider === "local" ? t("users.email") : t("users.google"),
                },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between gap-3">
                  <dt className="text-ink-subtle">{item.label}</dt>
                  <dd className="text-ink">{item.value}</dd>
                </div>
              ))}
            </dl>
          </Panel>
        )}

        <Panel title={t("form.verification")}>
          <label className="flex cursor-pointer items-start gap-3 text-sm">
            <input
              type="checkbox"
              name="verified"
              defaultChecked={user ? Boolean(user.isVerifed) : true}
              disabled={busy}
              className="mt-0.5 size-4 rounded-sm accent-ink"
            />
            <span className="min-w-0">
              <span className="block text-ink">{t("form.emailVerified")}</span>
              <span className="block text-xs text-ink-subtle">{t("form.unverifiedNote")}</span>
            </span>
          </label>
        </Panel>

        <div className="flex flex-col gap-2 rounded-lg border border-line bg-surface p-4">
          <Button type="submit" fullWidth disabled={busy}>
            {busy ? (
              <>
                <Loader2 className="size-4 animate-spin" strokeWidth={1.75} aria-hidden />
                {tCommon("saving")}
              </>
            ) : (
              submitLabel
            )}
          </Button>
          <Link
            href={`${config.base}/users`}
            className="flex h-11 items-center justify-center rounded-md border border-line-strong bg-canvas px-6 text-sm font-medium text-ink transition-colors hover:border-ink hover:bg-surface"
          >
            {tCommon("cancel")}
          </Link>
        </div>
      </div>
    </form>
  );
}
