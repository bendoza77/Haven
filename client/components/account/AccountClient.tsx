"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  AlertCircle,
  BadgeCheck,
  Check,
  Heart,
  Loader2,
  LogOut,
  MailWarning,
  MapPinned,
  Package,
  Settings,
  ShoppingBag,
  User,
} from "lucide-react";
import AccountAddresses from "@/components/account/AccountAddresses";
import AccountOrders from "@/components/account/AccountOrders";
import TwoFactorSetting from "@/components/account/TwoFactorSetting";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { LanguageChoice } from "@/components/ui/LanguageToggle";
import { useDates } from "@/lib/format";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "profile", icon: User },
  { id: "orders", icon: Package },
  { id: "addresses", icon: MapPinned },
  { id: "settings", icon: Settings },
] as const;

type TabId = (typeof tabs)[number]["id"];

const initialsOf = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-label={title}>
      <h2 className="font-display text-2xl tracking-tight text-ink sm:text-3xl">{title}</h2>
      {description && <p className="mt-2 text-sm text-ink-muted">{description}</p>}
      <div className="mt-8">{children}</div>
    </section>
  );
}

/**
 * The account screen, drawn from the signed-in shopper.
 *
 * The profile, the figures and the two lists are the account's own. Orders and
 * addresses are still sample data and say so — there is no Order model behind
 * them yet.
 */
export default function AccountClient({ tab }: { tab: TabId }) {
  const t = useTranslations("account");
  const tCommon = useTranslations("common");
  const dates = useDates();
  const router = useRouter();
  const { user, loading, logout, cartCount } = useAuth();

  /* Held only once edited — until then the field simply shows the account,
     so a change saved in another tab is not overwritten by stale state. */
  const [draftName, setDraftName] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login?next=%2Faccount");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <p className="flex items-center justify-center gap-2.5 py-24 text-sm text-ink-muted">
        <Loader2 className="size-4 animate-spin" strokeWidth={1.75} aria-hidden />
        {t("loading")}
      </p>
    );
  }

  const name = draftName ?? user.fullname;

  const saveName = async () => {
    setError(null);
    setSaving(true);
    try {
      await api.account.update({ fullname: name.trim() });
      setDraftName(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t("couldNotSave"));
    } finally {
      setSaving(false);
    }
  };

  const resendVerification = async () => {
    setError(null);
    try {
      await api.resendVerification(user.email);
      setResent(true);
    } catch (resendError) {
      setError(resendError instanceof Error ? resendError.message : t("couldNotSend"));
    }
  };

  const savedCount = user.favoriteProducts?.length ?? 0;

  return (
    <div className="grid gap-10 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-14">
      <aside>
        <div className="flex items-center gap-3 rounded-lg border border-line bg-surface p-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-medium text-canvas">
            {initialsOf(user.fullname)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">{user.fullname}</p>
            <p className="truncate text-xs text-ink-subtle">{user.email}</p>
          </div>
        </div>

        <nav aria-label={t("navLabel")} className="mt-6">
          <ul className="space-y-1">
            {tabs.map(({ id, icon: Icon }) => (
              <li key={id}>
                <Link
                  href={id === "profile" ? "/account" : `/account?tab=${id}`}
                  aria-current={tab === id ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                    tab === id
                      ? "bg-surface font-medium text-ink"
                      : "text-ink-muted hover:bg-surface hover:text-ink",
                  )}
                >
                  <Icon className="size-4" strokeWidth={1.75} aria-hidden />
                  {t(`tabs.${id}`)}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/wishlist"
                className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-ink-muted transition-colors hover:bg-surface hover:text-ink"
              >
                <Heart className="size-4" strokeWidth={1.75} aria-hidden />
                {t("wishlist")}
              </Link>
            </li>
            <li className="mt-2 border-t border-line pt-2">
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  router.push("/");
                }}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-ink-muted transition-colors hover:bg-surface hover:text-ink"
              >
                <LogOut className="size-4" strokeWidth={1.75} aria-hidden />
                {t("signOut")}
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      <div>
        {error && (
          <p className="mb-6 flex items-start gap-2.5 rounded-md bg-danger/10 px-4 py-3 text-sm text-danger">
            <AlertCircle className="mt-px size-4 shrink-0" strokeWidth={1.75} aria-hidden />
            {error}
          </p>
        )}

        {!user.isVerifed && (
          <div className="mb-8 flex flex-wrap items-center gap-4 rounded-lg border border-warning/40 bg-warning/5 px-4 py-3.5">
            <MailWarning className="size-4 shrink-0 text-warning" strokeWidth={1.75} aria-hidden />
            <p className="min-w-0 flex-1 text-sm text-ink-muted">
              {resent ? t("verifyResent") : t("verifyPrompt", { email: user.email })}
            </p>
            {!resent && (
              <Button type="button" size="sm" variant="secondary" onClick={resendVerification}>
                {t("resendLink")}
              </Button>
            )}
          </div>
        )}

        {tab === "profile" && (
          <Panel title={t("tabs.profile")} description={t("profileDescription")}>
            <dl className="grid gap-6 sm:grid-cols-3">
              {[
                { key: "inYourBag", value: String(cartCount) },
                { key: "savedPieces", value: String(savedCount) },
                { key: "memberSince", value: dates.monthYear(user.createdAt) },
              ].map((stat) => (
                <div key={stat.key} className="rounded-lg border border-line p-5">
                  <dt className="text-xs uppercase tracking-[0.14em] text-ink-subtle">
                    {t(stat.key)}
                  </dt>
                  <dd className="mt-2 font-display text-2xl text-ink">{stat.value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-10 rounded-lg border border-line p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-medium text-ink">{t("personalDetails")}</h3>
                {user.isVerifed && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-success">
                    <BadgeCheck className="size-4" strokeWidth={1.75} aria-hidden />
                    {t("emailConfirmed")}
                  </span>
                )}
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <Input
                  id="account-name"
                  label={t("fullName")}
                  value={name}
                  onChange={(event) => setDraftName(event.target.value)}
                />
                <Input
                  id="account-email"
                  label={t("email")}
                  defaultValue={user.email}
                  readOnly
                  hint={t("emailHint")}
                />
                <Input
                  id="account-signin"
                  label={t("signInMethod")}
                  defaultValue={
                    user.provider === "google" ? t("signInGoogle") : t("signInPassword")
                  }
                  readOnly
                />
                {/* This slot used to hold a decorative <select> offering English,
                    French and German, none of which did anything. It now drives
                    the real locale, so the account page and the header cannot
                    disagree about what language the shop is in. */}
                <div>
                  <p className="mb-2 block text-sm font-medium text-ink">{t("language")}</p>
                  <LanguageChoice />
                  <p className="mt-1.5 text-xs text-ink-subtle">{t("languageHint")}</p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  onClick={saveName}
                  disabled={saving || name.trim() === user.fullname || name.trim().length < 3}
                >
                  {saving && <Loader2 className="size-4 animate-spin" aria-hidden />}
                  {saving ? tCommon("saving") : tCommon("saveChanges")}
                </Button>
                {saved && (
                  <span className="inline-flex items-center gap-1.5 text-sm text-success">
                    <Check className="size-4" strokeWidth={2} aria-hidden />
                    {t("saved")}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Link
                href="/cart"
                className="flex items-center gap-3 rounded-lg border border-line p-5 transition-colors hover:border-ink"
              >
                <ShoppingBag className="size-5 text-ink" strokeWidth={1.5} aria-hidden />
                <span className="text-sm">
                  <span className="block font-medium text-ink">{t("yourBag")}</span>
                  <span className="block text-ink-subtle">
                    {cartCount === 0 ? t("bagEmpty") : t("bagWaiting", { count: cartCount })}
                  </span>
                </span>
              </Link>
              <Link
                href="/wishlist"
                className="flex items-center gap-3 rounded-lg border border-line p-5 transition-colors hover:border-ink"
              >
                <Heart className="size-5 text-ink" strokeWidth={1.5} aria-hidden />
                <span className="text-sm">
                  <span className="block font-medium text-ink">{t("savedPieces")}</span>
                  <span className="block text-ink-subtle">
                    {savedCount === 0 ? t("nothingSaved") : t("onYourList", { count: savedCount })}
                  </span>
                </span>
              </Link>
            </div>
          </Panel>
        )}

        {tab === "orders" && (
          <Panel title={t("tabs.orders")} description={t("ordersDescription")}>
            <AccountOrders />
          </Panel>
        )}

        {tab === "addresses" && (
          <Panel title={t("tabs.addresses")} description={t("addressesDescription")}>
            <AccountAddresses />
          </Panel>
        )}

        {tab === "settings" && (
          <Panel title={t("tabs.settings")} description={t("settingsDescription")}>
            <div className="space-y-4">
              <div className="rounded-lg border border-line p-6">
                <h3 className="text-sm font-medium text-ink">{t("password")}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  {user.provider === "google" ? t("passwordGoogle") : t("passwordLocal")}
                </p>
                {user.provider === "local" && (
                  <ButtonLink href="/forgot-password" variant="secondary" size="sm" className="mt-4">
                    {t("sendResetLink")}
                  </ButtonLink>
                )}
              </div>

              <TwoFactorSetting />

              <div className="rounded-lg border border-line p-6">
                <h3 className="text-sm font-medium text-ink">{t("region")}</h3>
                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <Select id="settings-country" label={t("country")} defaultValue="us">
                    {(["us", "ca", "uk"] as const).map((code) => (
                      <option key={code} value={code}>
                        {t(`countries.${code}`)}
                      </option>
                    ))}
                  </Select>
                  <Select id="settings-currency" label={t("currency")} defaultValue="usd">
                    {(["usd", "eur", "gbp"] as const).map((code) => (
                      <option key={code} value={code}>
                        {t(`currencies.${code}`)}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}
