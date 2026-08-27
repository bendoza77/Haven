"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check, Heart, Loader2, ShoppingBag } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { Product } from "@/lib/api";
import { cn } from "@/lib/utils";

/**
 * The two controls that sit over a product card.
 *
 * Both write to the account in MongoDB, so both need somebody signed in — a
 * signed-out visitor is sent to sign in with a note of where they were, and
 * comes straight back.
 */
export default function ProductCardActions({ product }: { product: Product }) {
  const t = useTranslations("product");
  const router = useRouter();
  const { user, isFavorite, toggleFavorite, addToCart } = useAuth();

  const [savingFavorite, setSavingFavorite] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saved = isFavorite(product._id);
  const soldOut = product.stock <= 0;

  const signInFirst = () => {
    router.push(`/login?next=${encodeURIComponent(`/product/${product.slug}`)}`);
  };

  const onToggleFavorite = async () => {
    if (!user) return signInFirst();

    setSavingFavorite(true);
    try {
      await toggleFavorite(product._id);
    } catch {
      /* The heart simply does not change — the next attempt can try again. */
    } finally {
      setSavingFavorite(false);
    }
  };

  const onAddToCart = async () => {
    if (!user) return signInFirst();

    setError(null);
    setAddingToCart(true);

    try {
      /* No size or colour from a card: the choices live on the product page,
         so a card adds the plain piece. */
      await addToCart({ productId: product._id, quantity: 1 });
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : t("couldNotAdd"));
    } finally {
      setAddingToCart(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={onToggleFavorite}
        disabled={savingFavorite}
        aria-pressed={saved}
        aria-label={
          saved
            ? t("removeFromSaved", { name: product.name })
            : t("saveNamed", { name: product.name })
        }
        className={cn(
          "absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-canvas/90 shadow-card backdrop-blur transition-colors hover:bg-canvas",
          saved ? "text-accent" : "text-ink hover:text-accent",
        )}
      >
        {savingFavorite ? (
          <Loader2 className="size-4 animate-spin" strokeWidth={1.75} aria-hidden />
        ) : (
          <Heart
            className="size-4"
            strokeWidth={1.75}
            fill={saved ? "currentColor" : "none"}
            aria-hidden
          />
        )}
      </button>

      <button
        type="button"
        onClick={onAddToCart}
        disabled={addingToCart || soldOut}
        className={cn(
          "absolute inset-x-3 bottom-3 hidden h-10 translate-y-2 items-center justify-center gap-2 rounded-md text-sm font-medium opacity-0 transition-[opacity,transform,background-color] duration-300 group-hover:translate-y-0 group-hover:opacity-100 sm:flex",
          soldOut
            ? "cursor-not-allowed bg-surface-strong text-ink-muted"
            : added
              ? "bg-success text-canvas"
              : "bg-ink text-canvas hover:bg-ink/90",
        )}
      >
        {soldOut ? (
          t("outOfStock")
        ) : addingToCart ? (
          <>
            <Loader2 className="size-4 animate-spin" strokeWidth={2} aria-hidden />
            {t("adding")}
          </>
        ) : added ? (
          <>
            <Check className="size-4" strokeWidth={2} aria-hidden />
            {t("inYourBag")}
          </>
        ) : (
          <>
            <ShoppingBag className="size-4" strokeWidth={1.75} aria-hidden />
            {t("addToBag")}
          </>
        )}
      </button>

      {error && (
        <p className="absolute inset-x-3 bottom-3 rounded-md bg-danger px-3 py-2 text-center text-xs text-canvas">
          {error}
        </p>
      )}
    </>
  );
}
