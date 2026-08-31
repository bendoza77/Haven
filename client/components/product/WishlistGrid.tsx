"use client";

import { useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Check, Heart, Loader2, X } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Price from "@/components/ui/Price";
import Rating from "@/components/ui/Rating";
import { useAuth } from "@/context/AuthContext";

/**
 * The saved list, read straight off the signed-in account. Removing a piece
 * writes to the database and the context answers with the new account, so the
 * grid and the header count move together.
 */
export default function WishlistGrid() {
  const t = useTranslations("wishlist");
  const tAuth = useTranslations("auth");
  const tProduct = useTranslations("product");

  const { user, loading, toggleFavorite, addToCart } = useAuth();
  const [busy, setBusy] = useState<string | null>(null);
  const [added, setAdded] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return (
      <p className="flex items-center justify-center gap-2.5 py-20 text-sm text-ink-muted">
        <Loader2 className="size-4 animate-spin" strokeWidth={1.75} aria-hidden />
        {t("loading")}
      </p>
    );
  }

  if (!user) {
    return (
      <EmptyState
        icon={<Heart className="size-6" aria-hidden />}
        title={t("signInTitle")}
        description={t("signInBody")}
        actions={
          <>
            <ButtonLink href="/login?next=%2Fwishlist">{tAuth("signIn")}</ButtonLink>
            <ButtonLink href="/register" variant="secondary">
              {tAuth("createAccount")}
            </ButtonLink>
          </>
        }
      />
    );
  }

  const items = user.favoriteProducts ?? [];

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Heart className="size-6" aria-hidden />}
        title={t("emptyTitle")}
        description={t("emptyBody")}
        actions={
          <>
            <ButtonLink href="/shop">{t("browseCollection")}</ButtonLink>
            <ButtonLink href="/categories" variant="secondary">
              {t("shopByCategory")}
            </ButtonLink>
          </>
        }
      />
    );
  }

  const remove = async (productId: string) => {
    setBusy(productId);
    setError(null);
    try {
      await toggleFavorite(productId);
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : t("couldNotRemove"));
    } finally {
      setBusy(null);
    }
  };

  const add = async (productId: string) => {
    setBusy(productId);
    setError(null);
    try {
      await addToCart({ productId, quantity: 1 });
      setAdded(productId);
      setTimeout(() => setAdded(null), 2000);
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : tProduct("couldNotAddToBag"));
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      {error && (
        <p className="mb-6 rounded-md bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>
      )}

      <ul className="grid gap-x-4 gap-y-10 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-4">
        {items.map((product) => (
          <li key={product._id} className="group flex flex-col">
            <div className="relative overflow-hidden rounded-lg bg-surface">
              <Link href={`/product/${product.slug}`} className="relative block aspect-4/5">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </Link>
              <button
                type="button"
                onClick={() => remove(product._id)}
                disabled={busy === product._id}
                aria-label={t("removeNamed", { name: product.name })}
                className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-canvas/90 text-ink shadow-card backdrop-blur transition-colors hover:bg-canvas hover:text-danger"
              >
                {busy === product._id ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <X className="size-4" aria-hidden />
                )}
              </button>
            </div>

            <div className="mt-4 flex flex-1 flex-col gap-1.5">
              <h2 className="text-[0.9375rem] font-medium leading-snug text-ink">
                <Link
                  href={`/product/${product.slug}`}
                  className="transition-colors hover:text-accent"
                >
                  {product.name}
                </Link>
              </h2>
              <Rating value={product.rating} reviewCount={product.reviewCount} />
              <Price price={product.price} previousPrice={product.previousPrice} className="mt-1" />

              <Button
                type="button"
                variant="secondary"
                size="sm"
                fullWidth
                className="mt-4"
                disabled={busy === product._id || product.stock <= 0}
                onClick={() => add(product._id)}
              >
                {product.stock <= 0 ? (
                  tProduct("outOfStock")
                ) : added === product._id ? (
                  <>
                    <Check className="size-4" strokeWidth={2} aria-hidden />
                    {tProduct("inYourBag")}
                  </>
                ) : (
                  tProduct("addToBag")
                )}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
