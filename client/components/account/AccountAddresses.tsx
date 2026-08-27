"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, Loader2, MapPinned, Pencil, Plus, Star, Trash2, X } from "lucide-react";
import ConfirmDialog from "@/components/console/ConfirmDialog";
import Badge from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Field";
import { useAuth } from "@/context/AuthContext";
import { api, type Address } from "@/lib/api";

/**
 * The account's address book.
 *
 * Addresses live on the account document, so every write here answers with the
 * whole account and the auth context adopts it — one round trip both saves the
 * change and refreshes everything drawing from it.
 *
 * Exactly one address is the default. That invariant is kept on the server, so
 * this screen only ever asks for it and never has to reconcile two.
 */
export default function AccountAddresses() {
  const t = useTranslations("addresses");
  const tCommon = useTranslations("common");

  const { user, adopt } = useAuth();

  const [editing, setEditing] = useState<Address | "new" | null>(null);
  const [target, setTarget] = useState<Address | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addresses = user?.addresses ?? [];

  const onSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (busy || !editing) return;

    const form = new FormData(event.currentTarget);
    const payload = {
      label: String(form.get("label") ?? "").trim(),
      recipient: String(form.get("recipient") ?? "").trim(),
      line1: String(form.get("line1") ?? "").trim(),
      line2: String(form.get("line2") ?? "").trim(),
      city: String(form.get("city") ?? "").trim(),
      region: String(form.get("region") ?? "").trim(),
      postcode: String(form.get("postcode") ?? "").trim(),
      country: String(form.get("country") ?? "").trim(),
      phone: String(form.get("phone") ?? "").trim(),
      isDefault: form.get("isDefault") === "on",
    };

    const missing = (["label", "recipient", "line1", "city", "postcode", "country"] as const).filter(
      (field) => !payload[field],
    );

    if (missing.length) {
      setError(t("missingFields"));
      return;
    }

    setError(null);
    setBusy(true);

    try {
      const response =
        editing === "new"
          ? await api.account.addAddress(payload)
          : await api.account.updateAddress(editing._id, payload);

      adopt(response.data);
      setEditing(null);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : t("couldNotSave"));
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async () => {
    if (!target) return;

    setBusy(true);
    setError(null);

    try {
      const response = await api.account.removeAddress(target._id);
      adopt(response.data);
      setTarget(null);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : t("couldNotRemove"));
    } finally {
      setBusy(false);
    }
  };

  const makeDefault = async (address: Address) => {
    setBusy(true);
    setError(null);

    try {
      const response = await api.account.updateAddress(address._id, { isDefault: true });
      adopt(response.data);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : t("couldNotDefault"));
    } finally {
      setBusy(false);
    }
  };

  const current = editing === "new" ? null : editing;

  return (
    <div>
      {error && (
        <p className="mb-5 flex items-start gap-2.5 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          <AlertCircle className="mt-px size-4 shrink-0" strokeWidth={1.75} aria-hidden />
          {error}
        </p>
      )}

      {addresses.length === 0 ? (
        <EmptyState
          icon={<MapPinned className="size-6" strokeWidth={1.5} aria-hidden />}
          title={t("emptyTitle")}
          description={t("emptyBody")}
          actions={
            <Button type="button" onClick={() => setEditing("new")}>
              <Plus className="size-4" strokeWidth={2} aria-hidden />
              {t("addAddress")}
            </Button>
          }
        />
      ) : (
        <>
          <div className="mb-5 flex justify-end">
            <Button type="button" variant="secondary" size="sm" onClick={() => setEditing("new")}>
              <Plus className="size-4" strokeWidth={2} aria-hidden />
              {t("addAddress")}
            </Button>
          </div>

          <ul className="grid gap-4 sm:grid-cols-2">
            {addresses.map((address) => (
              <li key={address._id} className="flex flex-col rounded-lg border border-line p-6">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-medium text-ink">{address.label}</h3>
                  {address.isDefault && <Badge>{t("default")}</Badge>}
                </div>

                <p className="mt-4 text-sm text-ink">{address.recipient}</p>

                <address className="mt-1 flex-1 text-sm not-italic leading-relaxed text-ink-muted">
                  <span className="block">{address.line1}</span>
                  {address.line2 && <span className="block">{address.line2}</span>}
                  <span className="block">
                    {address.city}
                    {address.region ? `, ${address.region}` : ""} {address.postcode}
                  </span>
                  <span className="block">{address.country}</span>
                  {address.phone && <span className="mt-1 block text-xs">{address.phone}</span>}
                </address>

                <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={busy}
                    onClick={() => {
                      setError(null);
                      setEditing(address);
                    }}
                  >
                    <Pencil className="size-3.5" strokeWidth={1.75} aria-hidden />
                    {tCommon("edit")}
                  </Button>

                  {!address.isDefault && (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={busy}
                        onClick={() => void makeDefault(address)}
                      >
                        <Star className="size-3.5" strokeWidth={1.75} aria-hidden />
                        {t("makeDefault")}
                      </Button>

                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          setError(null);
                          setTarget(address);
                        }}
                        aria-label={t("removeNamed", { label: address.label })}
                        className="ml-auto flex size-8 items-center justify-center rounded-md text-ink-subtle transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-60"
                      >
                        <Trash2 className="size-4" strokeWidth={1.75} aria-hidden />
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* ------------------------------------------------- the editor */}
      {editing && (
        <div className="fixed inset-0 z-200 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label={tCommon("cancel")}
            onClick={() => setEditing(null)}
            className="absolute inset-0 bg-feature/50 backdrop-blur-[2px]"
          />

          <form
            onSubmit={onSave}
            noValidate
            role="dialog"
            aria-modal="true"
            aria-label={current ? t("editAddress") : t("addAddress")}
            className="relative max-h-full w-full max-w-lg overflow-y-auto rounded-lg border border-line bg-canvas p-6 shadow-pop"
          >
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-display text-xl tracking-tight text-ink">
                {current ? t("editAddress") : t("addAddress")}
              </h2>
              <button
                type="button"
                onClick={() => setEditing(null)}
                aria-label={tCommon("close")}
                className="flex size-8 items-center justify-center rounded-md text-ink-subtle transition-colors hover:bg-surface hover:text-ink"
              >
                <X className="size-4" strokeWidth={1.75} aria-hidden />
              </button>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <Input id="addr-label" name="label" label={t("labelField")} placeholder={t("labelPlaceholder")} defaultValue={current?.label ?? ""} disabled={busy} required />
              <Input id="addr-recipient" name="recipient" label={t("recipient")} placeholder={t("recipientPlaceholder")} defaultValue={current?.recipient ?? user?.fullname ?? ""} disabled={busy} required />
              <Input id="addr-line1" name="line1" label={t("line1")} placeholder={t("line1Placeholder")} defaultValue={current?.line1 ?? ""} disabled={busy} className="sm:col-span-2" required />
              <Input id="addr-line2" name="line2" label={t("line2")} placeholder={t("line2Placeholder")} defaultValue={current?.line2 ?? ""} disabled={busy} className="sm:col-span-2" />
              <Input id="addr-city" name="city" label={t("city")} placeholder={t("cityPlaceholder")} defaultValue={current?.city ?? ""} disabled={busy} required />
              <Input id="addr-region" name="region" label={t("region")} placeholder={t("regionPlaceholder")} defaultValue={current?.region ?? ""} disabled={busy} />
              <Input id="addr-postcode" name="postcode" label={t("postcode")} placeholder={t("postcodePlaceholder")} defaultValue={current?.postcode ?? ""} disabled={busy} required />
              <Input id="addr-country" name="country" label={t("country")} placeholder={t("countryPlaceholder")} defaultValue={current?.country ?? "United States"} disabled={busy} required />
              <Input id="addr-phone" name="phone" label={t("phone")} type="tel" placeholder={t("phonePlaceholder")} defaultValue={current?.phone ?? ""} disabled={busy} className="sm:col-span-2" />
            </div>

            {/* The first address is the default whatever this says, so the box
                is only offered once there is something to be default over. */}
            {(addresses.length > 0 && !current?.isDefault) && (
              <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  name="isDefault"
                  defaultChecked={addresses.length === 0}
                  disabled={busy}
                  className="mt-0.5 size-4 rounded-sm accent-ink"
                />
                <span>
                  <span className="block text-ink">{t("makeThisDefault")}</span>
                  <span className="block text-xs text-ink-subtle">{t("makeThisDefaultHint")}</span>
                </span>
              </label>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="secondary" disabled={busy} onClick={() => setEditing(null)}>
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? (
                  <>
                    <Loader2 className="size-4 animate-spin" strokeWidth={1.75} aria-hidden />
                    {tCommon("saving")}
                  </>
                ) : current ? (
                  t("saveAddress")
                ) : (
                  t("addAddressSubmit")
                )}
              </Button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(target)}
        title={t("confirmRemoveTitle")}
        body={t("confirmRemoveBody", { label: target?.label ?? "" })}
        confirmLabel={t("confirmRemoveAction")}
        busy={busy}
        onConfirm={onDelete}
        onCancel={() => setTarget(null)}
      />
    </div>
  );
}
