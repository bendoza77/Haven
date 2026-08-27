"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AlertCircle, Loader2, Lock } from "lucide-react";
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

const paymentOptions = [
  { id: "card", key: "card" },
  { id: "paypal", key: "paypal" },
  { id: "wallet", key: "wallet" },
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
 * No money moves: there is no payment provider behind the card fields, and the
 * page says so. Everything else is real — the order is written, stock comes
 * down, the bag is emptied and a confirmation is emailed.
 */
export default function CheckoutFlow() {
  const t = useTranslations("checkout");
  const money = useMoney();
  const router = useRouter();
  const { user, refresh } = useAuth();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placed, setPlaced] = useState<Order | null>(null);

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

      const response = await api.orders.create({ shipping, deliveryMethod });

      /* The bag was emptied server-side; pull the account down so the header
         count and the summary agree with it. */
      await refresh();

      setPlaced(response.data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : t("couldNotPlace"));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setBusy(false);
    }
  };

  if (placed) {
    return (
      <div className="mx-auto max-w-lg rounded-lg border border-line bg-surface p-8 text-center">
        <h2 className="font-display text-3xl leading-tight tracking-tight text-ink">
          {t("thankYou", { reference: placed.reference })}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          {t("confirmationSent")} <span className="text-ink">{user?.email}</span>.
        </p>

        <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => router.push("/account?tab=orders")}
            className="flex h-11 items-center justify-center rounded-md bg-ink px-6 text-sm font-medium text-canvas transition-colors hover:bg-ink/90"
          >
            {t("viewOrders")}
          </button>
          <button
            type="button"
            onClick={() => router.push("/shop")}
            className="flex h-11 items-center justify-center rounded-md border border-line-strong bg-canvas px-6 text-sm font-medium text-ink transition-colors hover:border-ink"
          >
            {t("keepShopping")}
          </button>
        </div>
      </div>
    );
  }

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
            <div className="space-y-3">
              {paymentOptions.map((option, index) => (
                <RadioCard
                  key={option.id}
                  name="payment"
                  id={`payment-${option.id}`}
                  value={option.id}
                  title={t(`payment.${option.key}Title`)}
                  description={t(`payment.${option.key}Body`)}
                  defaultChecked={index === 0}
                />
              ))}
            </div>

            <div className="mt-6 grid gap-5 rounded-md border border-line bg-surface p-5 sm:grid-cols-2">
              <Input id="card-number" label={t("cardNumber")} inputMode="numeric" autoComplete="off" placeholder={t("cardNumberPlaceholder")} disabled={busy} className="sm:col-span-2" />
              <Input id="card-expiry" label={t("cardExpiry")} autoComplete="off" placeholder={t("cardExpiryPlaceholder")} disabled={busy} />
              <Input id="card-cvc" label={t("cardCvc")} autoComplete="off" placeholder={t("cardCvcPlaceholder")} disabled={busy} />
            </div>

            {/* Said plainly rather than implied: the order is real, the payment
                is not, and nobody should type a live card number in here. */}
            <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-ink-subtle">
              <Lock className="mt-px size-3.5 shrink-0" aria-hidden />
              {t("paymentNotice")}
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
                {t("placing")}
              </>
            ) : (
              t("placeOrder")
            )
          }
        />
      </div>
    </div>
  );
}
