"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { AlertCircle, Check, Heart, Loader2 } from "lucide-react";
import ProductOptions from "@/components/product/ProductOptions";
import { Button } from "@/components/ui/Button";
import QuantityStepper from "@/components/ui/QuantityStepper";
import { useAuth } from "@/context/AuthContext";
import type { Product } from "@/lib/api";
import { cn } from "@/lib/utils";

/**
 * Everything on the product page that writes to the account: the options, the
 * quantity, the bag and the saved list.
 *
 * The colour and size chosen here travel with the piece, so the same shirt in
 * two sizes becomes two lines of the bag rather than one line of two.
 */
export default function ProductPurchase({ product }: { product: Product }) {
  const t = useTranslations("product");
  const router = useRouter();
  const { user, isFavorite, toggleFavorite, addToCart } = useAuth();

  const [colour, setColour] = useState(product.colors?.[0]?.name);
  const [size, setSize] = useState(product.sizes?.[1] ?? product.sizes?.[0]);
  const [quantity, setQuantity] = useState(1);

  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saved = isFavorite(product._id);
  const soldOut = product.stock <= 0;

  /* The server caps on stock minus what this account already has in the bag,
     so the stepper has to as well — otherwise a shopper with two already in
     their bag can still pick the full stock count and be refused on submit.
     Every line of this piece counts, whatever size or colour it is. */
  const alreadyInBag = (user?.cart ?? [])
    .filter((line) => line.product?._id === product._id)
    .reduce((count, line) => count + line.quantity, 0);

  const canAdd = Math.max(0, product.stock - alreadyInBag);

  /* Derived rather than stored: adding to the bag lowers the ceiling under the
     chosen quantity, and clamping in an effect would mean rendering the stale
     number once before correcting it. */
  const chosen = Math.min(quantity, Math.max(1, canAdd));

  const signInFirst = () =>
    router.push(`/login?next=${encodeURIComponent(`/product/${product.slug}`)}`);

  const onAdd = async () => {
    if (!user) return signInFirst();

    setError(null);
    setAdding(true);

    try {
      await addToCart({ productId: product._id, quantity: chosen, size, color: colour });
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : t("couldNotAddToBag"));
    } finally {
      setAdding(false);
    }
  };

  const onSave = async () => {
    if (!user) return signInFirst();

    setSaving(true);
    try {
      await toggleFavorite(product._id);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t("couldNotSave"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="mt-8">
        <ProductOptions
          colors={product.colors}
          sizes={product.sizes}
          colour={colour}
          size={size}
          onColourChange={setColour}
          onSizeChange={setSize}
        />
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <QuantityStepper value={chosen} onChange={setQuantity} max={canAdd} />

        <Button
          type="button"
          size="lg"
          onClick={onAdd}
          disabled={adding || soldOut || (Boolean(user) && canAdd === 0)}
          className={cn(
            "order-3 w-full min-w-40 sm:order-2 sm:w-auto sm:flex-1",
            added && "bg-success hover:bg-success",
          )}
        >
          {soldOut ? (
            t("outOfStock")
          ) : user && canAdd === 0 ? (
            t("allStockInBag")
          ) : adding ? (
            <>
              <Loader2 className="size-4 animate-spin" strokeWidth={2} aria-hidden />
              {t("adding")}
            </>
          ) : added ? (
            <>
              <Check className="size-4" strokeWidth={2} aria-hidden />
              {t("addedToBag")}
            </>
          ) : (
            t("addToBag")
          )}
        </Button>

        <Button
          type="button"
          size="lg"
          variant="secondary"
          icon
          onClick={onSave}
          disabled={saving}
          aria-pressed={saved}
          aria-label={saved ? t("removeFromSavedShort") : t("saveForLater")}
          className={cn("order-2 sm:order-3", saved && "border-accent text-accent")}
        >
          {saving ? (
            <Loader2 className="size-5 animate-spin" strokeWidth={1.75} aria-hidden />
          ) : (
            <Heart
              className="size-5"
              strokeWidth={1.75}
              fill={saved ? "currentColor" : "none"}
              aria-hidden
            />
          )}
        </Button>
      </div>

      {(error || added) && (
        <p
          className={cn(
            "mt-4 flex items-start gap-2.5 rounded-md px-3.5 py-3 text-sm",
            error ? "bg-danger/10 text-danger" : "bg-success/10 text-success",
          )}
        >
          {error ? (
            <>
              <AlertCircle className="mt-px size-4 shrink-0" strokeWidth={1.75} aria-hidden />
              {error}
            </>
          ) : (
            <>
              <Check className="mt-px size-4 shrink-0" strokeWidth={1.75} aria-hidden />
              <span>
                {t("addedToBagWithLink")}{" "}
                <Link href="/cart" className="font-medium underline underline-offset-2">
                  {t("viewBag")}
                </Link>
              </span>
            </>
          )}
        </p>
      )}

      {/* Says the thing that actually limits the stepper. Once some of the
          stock is already in the bag, the shelf count alone would not explain
          why the plus button stopped. */}
      {!soldOut && alreadyInBag > 0 && canAdd === 0 && (
        <p className="mt-4 text-sm text-warning">
          {t("allInBag", { stock: product.stock })}
        </p>
      )}

      {!soldOut && alreadyInBag > 0 && canAdd > 0 && canAdd <= 5 && (
        <p className="mt-4 text-sm text-warning">
          {t("someInBag", { inBag: alreadyInBag, remaining: canAdd })}
        </p>
      )}

      {!soldOut && alreadyInBag === 0 && product.stock <= 5 && (
        <p className="mt-4 text-sm text-warning">
          {t("lowStock", { stock: product.stock })}
        </p>
      )}
    </>
  );
}
