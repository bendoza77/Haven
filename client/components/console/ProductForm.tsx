"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { AlertCircle, CheckCircle2, Loader2, Plus, Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/console/ConfirmDialog";
import ImagePicker from "@/components/console/ImagePicker";
import Panel from "@/components/console/Panel";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { api, type Product, type ProductInput } from "@/lib/api";
import { BADGES, CATEGORIES, COLLECTIONS, slugify, type ConsoleConfig } from "@/lib/console";

const field =
  "h-11 w-full rounded-md border border-line-strong bg-canvas px-3.5 text-sm text-ink transition-colors placeholder:text-ink-subtle hover:border-ink-subtle focus:border-ink focus:outline-none";

const ghostRow =
  "flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-line-strong px-3 py-2.5 text-sm text-ink-muted transition-colors hover:border-ink hover:text-ink";

const removeRow =
  "flex size-9 shrink-0 items-center justify-center rounded-md border border-line text-ink-subtle transition-colors hover:border-danger hover:text-danger";

type Collection = Product["collections"][number];

/** Everything the form holds. Numbers stay strings until submit. */
type FormState = {
  name: string;
  slug: string;
  category: string;
  price: string;
  previousPrice: string;
  description: string;
  details: string[];
  colors: { name: string; hex: string }[];
  sizes: string;
  badge: string;
  collections: Collection[];
  stock: string;
  isActive: boolean;
  images: string[];
};

const blank: FormState = {
  name: "",
  slug: "",
  category: CATEGORIES[0],
  price: "",
  previousPrice: "",
  description: "",
  details: [""],
  colors: [],
  sizes: "",
  badge: "",
  collections: [],
  stock: "0",
  isActive: true,
  images: [],
};

const fromProduct = (product: Product): FormState => ({
  name: product.name,
  slug: product.slug,
  category: product.category,
  price: String(product.price),
  previousPrice: product.previousPrice === undefined ? "" : String(product.previousPrice),
  description: product.description,
  details: product.details.length ? product.details : [""],
  colors: product.colors ?? [],
  sizes: (product.sizes ?? []).join(", "),
  badge: product.badge ?? "",
  collections: product.collections ?? [],
  stock: String(product.stock ?? 0),
  isActive: product.isActive,
  // The primary image is just the first of the gallery as far as the form is
  // concerned; they are split apart again on submit.
  images: [product.image, ...(product.images ?? []).filter((image) => image !== product.image)],
});

/**
 * The product editor. Creates when it is handed no product, updates when it
 * is — the layout and every field are the same either way, so an operator
 * learns one screen.
 */
export default function ProductForm({
  config,
  product,
  submitLabel,
}: {
  config: ConsoleConfig;
  product?: Product;
  submitLabel: string;
}) {
  const t = useTranslations("console");
  const tCat = useTranslations("categories");
  const tProduct = useTranslations("product");
  const tCommon = useTranslations("common");

  const router = useRouter();
  const [form, setForm] = useState<FormState>(product ? fromProduct(product) : blank);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setSaved(false);
  };

  /* The moderator console renders this form for new pieces only, so an
     existing product here always means an admin is editing it. */
  const canDelete = Boolean(product) && config.can.remove;

  const validate = (): string | null => {
    if (!form.name.trim()) return "nameRequired";
    if (form.images.length === 0) return "imageRequired";
    if (!form.price.trim() || Number.isNaN(Number(form.price))) return "priceRequired";
    if (Number(form.price) < 0) return "priceNegative";
    if (form.description.trim().length < 20)
      return "descriptionTooShort";
    return null;
  };

  const buildPayload = (): ProductInput => ({
    name: form.name.trim(),
    slug: form.slug.trim() ? slugify(form.slug) : slugify(form.name),
    category: form.category,
    price: Number(form.price),
    // An empty box means "no compare-at price"; the API clears the field.
    previousPrice: form.previousPrice.trim()
      ? Number(form.previousPrice)
      : (undefined as unknown as number),
    image: form.images[0],
    images: form.images,
    description: form.description.trim(),
    details: form.details.map((detail) => detail.trim()).filter(Boolean),
    colors: form.colors.filter((color) => color.name.trim() && /^#[0-9a-f]{6}$/i.test(color.hex)),
    sizes: form.sizes
      .split(",")
      .map((size) => size.trim())
      .filter(Boolean),
    badge: (form.badge || undefined) as Product["badge"],
    collections: form.collections,
    stock: Number(form.stock) || 0,
    isActive: form.isActive,
  });

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const problem = validate();
    if (problem) {
      setError(t(`form.${problem}`));
      return;
    }

    setError(null);
    setSaving(true);

    try {
      const payload = buildPayload();

      if (product) {
        /* PATCH ignores undefined, so an empty compare-at price is sent as ""
           — which is how the API is told to clear it. */
        await api.products.update(product._id, {
          ...payload,
          previousPrice: (form.previousPrice.trim()
            ? Number(form.previousPrice)
            : "") as unknown as number,
          badge: (form.badge || "") as Product["badge"],
        });
        setSaved(true);
        router.refresh();
      } else {
        await api.products.create(payload);
        router.push(`${config.base}/products`);
        router.refresh();
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t("form.couldNotSave"));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!product) return;

    setDeleting(true);

    try {
      await api.products.remove(product._id);
      router.push(`${config.base}/products`);
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : t("form.couldNotDelete"));
      setDeleting(false);
      setConfirmingDelete(false);
    }
  };

  return (
    <>
      <form
        onSubmit={onSubmit}
        className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start"
      >
        {(error || saved) && (
          <div className="lg:col-span-2">
            {error && (
              <p className="flex items-start gap-2.5 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
                <AlertCircle className="mt-px size-4 shrink-0" strokeWidth={1.75} aria-hidden />
                {error}
              </p>
            )}
            {saved && !error && (
              <p className="flex items-start gap-2.5 rounded-lg border border-success/30 bg-success/5 px-4 py-3 text-sm text-success">
                <CheckCircle2 className="mt-px size-4 shrink-0" strokeWidth={1.75} aria-hidden />
                {t("form.saved")}
              </p>
            )}
          </div>
        )}

        <div className="space-y-6">
          <Panel title={t("form.details")} description={t("form.detailsHint")}>
            <div className="grid gap-5">
              <Input
                id="product-name"
                label={t("form.productName")}
                placeholder={t("form.productNamePlaceholder")}
                value={form.name}
                onChange={(event) => set("name", event.target.value)}
              />
              <Input
                id="product-slug"
                label={t("form.urlSlug")}
                placeholder={form.name ? slugify(form.name) : t("form.slugPlaceholder")}
                value={form.slug}
                onChange={(event) => set("slug", event.target.value)}
                hint={t("form.slugHint")}
              />
              <Textarea
                id="product-description"
                label={t("form.description")}
                rows={5}
                placeholder={t("form.descriptionPlaceholder")}
                value={form.description}
                onChange={(event) => set("description", event.target.value)}
                hint={t("form.descriptionHint", { count: form.description.trim().length })}
              />
            </div>
          </Panel>

          <Panel title={t("form.specification")} description={t("form.detailLines")}>
            <ul className="space-y-3">
              {form.details.map((detail, index) => (
                <li key={index} className="flex items-center gap-2">
                  <input
                    aria-label={t("form.detailNumbered", { index: index + 1 })}
                    placeholder={t("form.detailPlaceholder")}
                    value={detail}
                    onChange={(event) =>
                      set(
                        "details",
                        form.details.map((item, at) => (at === index ? event.target.value : item)),
                      )
                    }
                    className={field}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      set("details", form.details.filter((_, at) => at !== index))
                    }
                    className={removeRow}
                    aria-label={t("form.removeDetail", { index: index + 1 })}
                  >
                    <Trash2 className="size-4" strokeWidth={1.75} aria-hidden />
                  </button>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => set("details", [...form.details, ""])}
              className={`${ghostRow} mt-3`}
            >
              <Plus className="size-4" strokeWidth={1.75} aria-hidden />
              {t("form.addLine")}
            </button>
          </Panel>

          <Panel
            title={t("form.media")}
            description={t("form.mediaHint")}
          >
            <ImagePicker
              value={form.images}
              onChange={(images) => set("images", images)}
              disabled={saving}
            />
          </Panel>

          <Panel title={t("form.options")} description={t("form.optionsHint")}>
            <div className="grid gap-6">
              <div>
                <p className="mb-3 text-sm font-medium text-ink">{t("form.colours")}</p>

                {form.colors.length === 0 && (
                  <p className="mb-3 text-xs text-ink-subtle">
                    {t("form.noColours")}
                  </p>
                )}

                <ul className="space-y-3">
                  {form.colors.map((color, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span
                        aria-hidden
                        className="size-9 shrink-0 rounded-md ring-1 ring-line"
                        style={{
                          backgroundColor: /^#[0-9a-f]{6}$/i.test(color.hex)
                            ? color.hex
                            : "var(--color-surface-strong)",
                        }}
                      />
                      <input
                        aria-label={t("form.colourName", { index: index + 1 })}
                        placeholder={t("form.colourPlaceholder")}
                        value={color.name}
                        onChange={(event) =>
                          set(
                            "colors",
                            form.colors.map((item, at) =>
                              at === index ? { ...item, name: event.target.value } : item,
                            ),
                          )
                        }
                        className={field}
                      />
                      <input
                        aria-label={t("form.colourHex", { index: index + 1 })}
                        placeholder="#2f4f3f"
                        value={color.hex}
                        onChange={(event) =>
                          set(
                            "colors",
                            form.colors.map((item, at) =>
                              at === index ? { ...item, hex: event.target.value } : item,
                            ),
                          )
                        }
                        className={`${field} w-32 shrink-0 font-mono`}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          set("colors", form.colors.filter((_, at) => at !== index))
                        }
                        className={removeRow}
                        aria-label={t("form.removeColour", { index: index + 1 })}
                      >
                        <Trash2 className="size-4" strokeWidth={1.75} aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => set("colors", [...form.colors, { name: "", hex: "#191512" }])}
                  className={`${ghostRow} mt-3`}
                >
                  <Plus className="size-4" strokeWidth={1.75} aria-hidden />
                  {t("form.addColour")}
                </button>
              </div>

              <Input
                id="product-sizes"
                label={t("form.sizes")}
                placeholder={t("form.sizesPlaceholder")}
                value={form.sizes}
                onChange={(event) => set("sizes", event.target.value)}
                hint={t("form.sizesHint")}
              />
            </div>
          </Panel>
        </div>

        {/* Deliberately not sticky. This column is taller than a laptop
            viewport, and a sticky element that overflows pins its top and puts
            everything past the fold — the save button included — permanently
            out of reach. It scrolls with the page instead. */}
        <div className="space-y-6">
          <Panel title={t("form.visibility")}>
            <fieldset className="space-y-2">
              <legend className="sr-only">{t("form.visibility")}</legend>

              {[
                { live: true, key: "live" },
                { live: false, key: "draft" },
              ].map((option) => (
                <label
                  key={option.key}
                  className="flex cursor-pointer items-start gap-3 rounded-md border border-line px-3.5 py-3 transition-colors hover:border-line-strong has-[:checked]:border-ink has-[:checked]:bg-surface"
                >
                  <input
                    type="radio"
                    name="product-visibility"
                    checked={form.isActive === option.live}
                    onChange={() => set("isActive", option.live)}
                    className="mt-0.5 size-4 accent-ink"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm text-ink">{t(`form.${option.key}`)}</span>
                    <span className="block text-xs text-ink-subtle">
                      {t(`form.${option.key}Hint`)}
                    </span>
                  </span>
                </label>
              ))}
            </fieldset>
          </Panel>

          <Panel title={t("form.pricingStock")}>
            <div className="grid gap-5">
              <Input
                id="product-price"
                label={t("form.price")}
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
                value={form.price}
                onChange={(event) => set("price", event.target.value)}
              />
              <Input
                id="product-previous-price"
                label={t("form.compareAtPrice")}
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
                value={form.previousPrice}
                onChange={(event) => set("previousPrice", event.target.value)}
                hint={t("form.compareAtHint")}
              />
              <Input
                id="product-stock"
                label={t("form.stockOnHand")}
                type="number"
                min={0}
                placeholder="0"
                value={form.stock}
                onChange={(event) => set("stock", event.target.value)}
              />
            </div>
          </Panel>

          <Panel title={t("form.organisation")}>
            <div className="grid gap-5">
              <Select
                id="product-category"
                label={t("form.category")}
                value={form.category}
                onChange={(event) => set("category", event.target.value)}
              >
                {CATEGORIES.map((slug) => (
                  <option key={slug} value={slug}>
                    {tCat(`${slug}.name`)}
                  </option>
                ))}
              </Select>

              <Select
                id="product-badge"
                label={t("form.badge")}
                value={form.badge}
                onChange={(event) => set("badge", event.target.value)}
              >
                <option value="">{t("form.noBadge")}</option>
                {BADGES.map((badge) => (
                  <option key={badge} value={badge}>
                    {tProduct(`badge.${badge.toLowerCase()}`)}
                  </option>
                ))}
              </Select>

              <div>
                <p className="mb-2 text-sm font-medium text-ink">{t("form.collectionsLabel")}</p>
                <ul className="space-y-2">
                  {COLLECTIONS.map((collection) => (
                    <li key={collection.value}>
                      <label className="flex cursor-pointer items-start gap-3 text-sm">
                        <input
                          type="checkbox"
                          checked={form.collections.includes(collection.value)}
                          onChange={(event) =>
                            set(
                              "collections",
                              event.target.checked
                                ? [...form.collections, collection.value]
                                : form.collections.filter((item) => item !== collection.value),
                            )
                          }
                          className="mt-0.5 size-4 rounded-sm accent-ink"
                        />
                        <span className="min-w-0">
                          <span className="block text-ink">
                            {t(`collections.${collection.key}`)}
                          </span>
                          <span className="block text-xs text-ink-subtle">
                            {t(`collections.${collection.key}Hint`)}
                          </span>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Panel>

          <div className="flex flex-col gap-2 rounded-lg border border-line bg-surface p-4">
            <Button type="submit" fullWidth disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" aria-hidden />}
              {saving ? tCommon("saving") : submitLabel}
            </Button>
            <Link
              href={`${config.base}/products`}
              className="flex h-11 items-center justify-center rounded-md border border-line-strong bg-canvas px-6 text-sm font-medium text-ink transition-colors hover:border-ink hover:bg-surface"
            >
              {tCommon("cancel")}
            </Link>
          </div>

          {canDelete && (
            <div className="rounded-lg border border-danger/30 bg-danger/5 p-4">
              <h2 className="text-sm font-medium text-ink">{t("form.deleteProduct")}</h2>
              <p className="mt-1 text-xs leading-relaxed text-ink-muted">{t("form.dangerBody")}</p>
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="mt-4 flex h-10 w-full items-center justify-center rounded-md border border-danger/40 px-4 text-sm font-medium text-danger transition-colors hover:bg-danger hover:text-canvas"
              >
                {t("form.deleteProduct")}
              </button>
            </div>
          )}
        </div>
      </form>

      <ConfirmDialog
        open={confirmingDelete}
        title={t("products.confirmDeleteTitle")}
        body={t("products.confirmDeleteBody", { name: product?.name ?? "" })}
        confirmLabel={t("products.confirmDeleteAction")}
        busy={deleting}
        onConfirm={onDelete}
        onCancel={() => setConfirmingDelete(false)}
      />
    </>
  );
}
