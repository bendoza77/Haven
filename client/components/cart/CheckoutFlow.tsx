"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AlertCircle, ArrowRight, CreditCard, Loader2, Lock, ShieldCheck } from "lucide-react";
import CheckoutSummary from "@/components/cart/CheckoutSummary";
import { Input, Select } from "@/components/ui/Field";
import { useAuth } from "@/context/AuthContext";
import { api, type Order } from "@/lib/api";
import { useMoney } from "@/lib/format";

/* The id is what the API stores, so it stays English; `key` addresses the
   translated wording and `price` is a number the locale formats. Standard
   delivery has no price because it is free at every basket size shown here. */
const deliveryOptions = [
  { id: "standard", key: "standard", price: undefined },
  { id: "express", key: "express", price: 25 },
  { id: "white-glove", key: "whiteGlove", price: 120 },
] as const;

/* Values stored on the order; the visible name is translated against
   `checkout.countries`. */
const COUNTRIES = [
  "United States",
  "Canada",
  "United Kingdom",
  "Germany",
  "France",
] as const;

function Fieldset({
  step,
  title,
  children,
}: {
  step: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="border-t border-line pt-8 first:border-t-0 first:pt-0">
      <legend className="sr-only">{title}</legend>
      <h2 className="mb-6 flex items-center gap-3 text-sm font-medium uppercase tracking-[0.14em] text-ink">
        <span className="flex size-6 items-center justify-center rounded-full bg-ink text-xs text-canvas">
          {step}
        </span>
        {title}
      </h2>
      {children}
    </fieldset>
  );
}

function RadioCard({
  name,
  id,
  value,
  title,
  description,
  meta,
  defaultChecked,
}: {
  name: string;
  id: string;
  value: string;
  title: string;
  description: string;
  meta?: string;
  defaultChecked?: boolean;
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-3 rounded-md border border-line-strong p-4 transition-colors hover:border-ink has-checked:border-ink has-checked:bg-surface"
    >
      <input
        type="radio"
        id={id}
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="mt-0.5 size-4 accent-ink"
      />
      <span className="flex-1">
        <span className="block text-sm font-medium text-ink">{title}</span>
        <span className="mt-0.5 block text-sm text-ink-muted">{description}</span>
      </span>
      {meta && <span className="text-sm text-ink">{meta}</span>}
    </label>
  );
}

const FORM_ID = "checkout-form";

/**
 * Checkout, end to end.
 *
 * The form and the summary are one component because the button that places
 * the order lives in the summary while the details live in the form — they
 * are joined by the `form` attribute on that button rather than by lifting
 * the whole thing into a context for one submit.
 *
 * The card details are collected by Stripe, not here. This form gathers an
 * address and a delivery choice, asks the API to open a Checkout session, and
 * hands the browser over — so no card number ever touches this application, and
 * there is nothing on this page for anybody to steal one from.
 *
 * Nothing is charged and nothing is decided by this component. The prices, the
 * totals and the order itself are the server's work; the shopper is only
 * choosing where the parcel goes.
 */
export default function CheckoutFlow() {
  const t = useTranslations("checkout");
  const locale = useLocale();
  const money = useMoney();
  const { user } = useAuth();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Prefilled from the account's default address, so somebody who has ordered
     before does not retype what we already hold. */
  const preset = user?.addresses?.find((address) => address.isDefault) ?? user?.addresses?.[0];

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (busy) return;

    const form = new FormData(event.currentTarget);

    const shipping = {
      recipient: String(form.get("recipient") ?? "").trim(),
      line1: String(form.get("line1") ?? "").trim(),
      line2: String(form.get("line2") ?? "").trim(),
      city: String(form.get("city") ?? "").trim(),
      region: String(form.get("region") ?? "").trim(),
      postcode: String(form.get("postcode") ?? "").trim(),
      country: String(form.get("country") ?? "").trim(),
      phone: String(form.get("phone") ?? "").trim(),
    };

    const missing = (["recipient", "line1", "city", "postcode", "country"] as const).filter(
      (field) => !shipping[field],
    );

    if (missing.length) {
      setError(t("missingFields"));
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const deliveryMethod = String(form.get("delivery") ?? "standard") as Order["deliveryMethod"];
    const save = form.get("saveAddress") === "on";

    setError(null);
    setBusy(true);

    try {
      /* Saved first: if the order succeeds and this fails, the shopper has an
         order but not the address they asked us to keep — the lesser loss. */
      if (save && user) {
        try {
          await api.account.addAddress({
            ...shipping,
            label: "Shipping",
            isDefault: (user.addresses?.length ?? 0) === 0,
          });
        } catch {
          /* Not worth failing a checkout over. */
        }
      }

      /* The locale travels with the order so Stripe returns the shopper to
         the language they were shopping in, rather than to a bare URL that has
         to be redirected and guesses from a cookie. */
      const response = await api.orders.checkout({ shipping, deliveryMethod, locale });

      /* Leaving the site, so `busy` deliberately stays true: the button must
         not spring back to "Pay" while the browser is still navigating, or
         somebody will press it again and open a second session. */
      window.location.assign(response.data.sessionUrl);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : t("couldNotPlace"));
      window.scrollTo({ top: 0, behavior: "smooth" });
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-16">
      <div className="min-w-0">
        <p role="alert" aria-live="polite" className="sr-only">
          {error ?? ""}
        </p>

        {error && (
          <p className="mb-8 flex items-start gap-2.5 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
            <AlertCircle className="mt-px size-4 shrink-0" strokeWidth={1.75} aria-hidden />
            {error}
          </p>
        )}

        <form id={FORM_ID} onSubmit={onSubmit} noValidate className="space-y-10">
          <Fieldset step={1} title={t("steps.customer")}>
            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                id="recipient"
                name="recipient"
                label={t("recipient")}
                autoComplete="name"
                placeholder={t("recipientPlaceholder")}
                defaultValue={preset?.recipient ?? user?.fullname ?? ""}
                disabled={busy}
                className="sm:col-span-2"
                required
              />
              <Input
                id="email"
                label={t("email")}
                type="email"
                autoComplete="email"
                defaultValue={user?.email ?? ""}
                hint={t("emailHint")}
                disabled
              />
              <Input
                id="phone"
                name="phone"
                label={t("phone")}
                type="tel"
                autoComplete="tel"
                placeholder={t("phonePlaceholder")}
                defaultValue={preset?.phone ?? ""}
                disabled={busy}
              />
            </div>
          </Fieldset>

          <Fieldset step={2} title={t("steps.shipping")}>
            <div className="grid gap-5 sm:grid-cols-2">
              <Input id="line1" name="line1" label={t("line1")} autoComplete="address-line1" placeholder={t("line1Placeholder")} defaultValue={preset?.line1 ?? ""} disabled={busy} className="sm:col-span-2" required />
              <Input id="line2" name="line2" label={t("line2")} autoComplete="address-line2" placeholder={t("line2Placeholder")} defaultValue={preset?.line2 ?? ""} disabled={busy} />
              <Input id="city" name="city" label={t("city")} autoComplete="address-level2" placeholder={t("cityPlaceholder")} defaultValue={preset?.city ?? ""} disabled={busy} required />
              <Input id="region" name="region" label={t("region")} autoComplete="address-level1" placeholder={t("regionPlaceholder")} defaultValue={preset?.region ?? ""} disabled={busy} />
              <Input id="postcode" name="postcode" label={t("postcode")} autoComplete="postal-code" placeholder={t("postcodePlaceholder")} defaultValue={preset?.postcode ?? ""} disabled={busy} required />
              <Select id="country" name="country" label={t("country")} defaultValue={preset?.country ?? "United States"} disabled={busy} className="sm:col-span-2">
                {COUNTRIES.map((country) => (
                  <option key={country} value={country}>
                    {t(`countries.${country}`)}
                  </option>
                ))}
              </Select>
            </div>

            {user && (
              <label className="mt-5 flex items-center gap-2.5 text-sm text-ink-muted">
                <input
                  type="checkbox"
                  name="saveAddress"
                  defaultChecked={!preset}
                  disabled={busy}
                  className="size-4 rounded-sm accent-ink"
                />
                {t("saveAddress")}
              </label>
            )}
          </Fieldset>

          <Fieldset step={3} title={t("steps.delivery")}>
            <div className="space-y-3">
              {deliveryOptions.map((option, index) => (
                <RadioCard
                  key={option.id}
                  name="delivery"
                  id={`delivery-${option.id}`}
                  value={option.id}
                  title={t(`delivery.${option.key}Title`)}
                  description={t(`delivery.${option.key}Body`)}
                  meta={
                    option.price === undefined
                      ? t("delivery.standardPrice")
                      : money(option.price)
                  }
                  defaultChecked={index === 0}
                />
              ))}
            </div>
          </Fieldset>

          <Fieldset step={4} title={t("steps.payment")}>
            {/* Not a form control: there is nothing to choose here and nothing
                to type. It says where the card details will be asked for, and
                by whom, because "next" is otherwise a leap of faith at exactly
                the moment a shopper is deciding whether to trust the site. */}
            <div className="rounded-lg border border-line-strong bg-surface p-5 sm:p-6">
              <div className="flex items-start gap-3.5">
                <span
                  aria-hidden
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ink text-canvas"
                >
                  <CreditCard className="size-[1.125rem]" strokeWidth={1.75} />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-medium text-ink">{t("stripe.title")}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                    {t("stripe.body")}
                  </p>
                </div>
              </div>

              <ul className="mt-5 grid gap-2.5 border-t border-line pt-5">
                {(["secure", "cards", "cancel"] as const).map((point) => (
                  <li key={point} className="flex items-start gap-2.5 text-sm text-ink-muted">
                    <ShieldCheck
                      className="mt-0.5 size-4 shrink-0 text-ink"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                    {t(`stripe.${point}`)}
                  </li>
                ))}
              </ul>
            </div>

            <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-ink-subtle">
              <Lock className="mt-px size-3.5 shrink-0" aria-hidden />
              {t("stripe.notice")}
            </p>
          </Fieldset>

        </form>
      </div>

      <div className="lg:sticky lg:top-28 lg:self-start">
        <CheckoutSummary
          formId={FORM_ID}
          busy={busy}
          label={
            busy ? (
              <>
                <Loader2 className="size-4 animate-spin" strokeWidth={1.75} aria-hidden />
                {t("redirecting")}
              </>
            ) : (
              <>
                {t("payWithCard")}
                <ArrowRight className="size-4" strokeWidth={1.75} aria-hidden />
              </>
            )
          }
        />
      </div>
    </div>
  );
}
